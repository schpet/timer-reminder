import * as vscode from "vscode"
import {
	loadTimerReminderConfigFromWorkspace,
	TimerReminderConfig,
	timerReminderConfigPath,
} from "../config"
import { HarvestApi, HarvestConfig, harvestConfigSchema, harvestFetch } from "../harvest/harvest"
import { meSchema } from "../harvest/harvest-api-schema"
import projectMachine from "./project-machine"

const secretStorageKey = "timer-reminder.harvestAccessToken"

/**
 *  separate machine for vscode specific actions– this could all be in
 *  project-machine.ts but it's easier to drop that code into the xstate
 *  viz tools if it's separate
 */
export function vscodeProjectMachine(vsContext: vscode.ExtensionContext) {
	return projectMachine.provide({
		actions: {
			readDurationsConfig: async ({ self }) => {
				try {
					const config = await loadTimerReminderConfigFromWorkspace()
					self.send({
						type: "SET_PROJECT_CONFIG",
						harvestProjectId: config.harvestProjectId,
					})
				} catch (error) {
					self.send({
						type: "CONFIG_READ_ERROR",
						reason: error instanceof Error ? error.message : "Unknown error",
					})
				}
			},
			removeApiKey: async ({ self }) => {
				await vsContext.secrets.delete(secretStorageKey)
			},
			readOrRequestApiKey: async ({ self }) => {
				const storedApiKeyJSON = await vsContext.secrets.get(secretStorageKey)

				if (storedApiKeyJSON) {
					try {
						const parsed = harvestConfigSchema.parse(JSON.parse(storedApiKeyJSON))
						self.send({
							type: "SET_API_KEY",
							harvestAccessToken: parsed,
						})
						return
					} catch (error) {
						vsContext.secrets.delete(secretStorageKey)
						vscode.window.showWarningMessage("Stored API key is invalid, please enter a new one")
					}
				}

				const response = await vscode.window.showInformationMessage(
					"Harvest API key is required for the timer-reminder extension to function.",
					"Set API Key",
					"Cancel",
				)

				if (response === "Set API Key") {
					const harvestAccessToken = await promptUserForHarvestAccessToken()
					if (!harvestAccessToken) {
						self.send({ type: "API_KEY_DECLINED" })
						return
					}

					await vsContext.secrets.store(secretStorageKey, JSON.stringify(harvestAccessToken))

					self.send({
						type: "SET_API_KEY",
						harvestAccessToken: harvestAccessToken,
					})
				} else {
					vscode.window.showWarningMessage(
						"A Harvest API key is required for this timer-reminder to function",
					)
					self.send({ type: "API_KEY_DECLINED" })
				}
			},
			checkTimer: async ({ context, self }) => {
				if (!context.harvestAccessToken || !context.projectId) {
					self.send({ type: "NO_TIMER_RUNNING" })
					return
				}
				try {
					let client = new HarvestApi(context.harvestAccessToken)
					const runningTimers = await client.fetchTimeEntriesRunning()

					if (runningTimers.length === 0) {
						self.send({ type: "NO_TIMER_RUNNING" })
						return
					}

					const runningTimerOnProject = runningTimers.find(
						(timer) => timer.project.id.toString() === context.projectId,
					)

					if (runningTimerOnProject) {
						self.send({
							type: "TIMER_RUNNING",
							timeEntry: runningTimerOnProject,
						})
					} else {
						self.send({ type: "TIMER_OTHER_PROJECT" })
					}
				} catch (error) {
					let errorMessage = error instanceof Error ? error.message : "Unknown error"

					vscode.window.showErrorMessage(`Error checking timer: ${errorMessage}`)
					self.send({ type: "NO_TIMER_RUNNING" })
				}
			},
			startProjectSetup: async ({ self, context }) => {
				const harvestAccessToken = context.harvestAccessToken

				if (!harvestAccessToken) {
					vscode.window.showErrorMessage("Harvest API token is required.")
					return
				}

				const client = new HarvestApi(harvestAccessToken)
				try {
					const projects = await client.fetchProjects()
					if (projects.length === 0) {
						vscode.window.showWarningMessage("No projects found in your Harvest account.")
						return
					}

					const items = projects.map((project) => ({
						label: project.name,
						projectId: project.id.toString(),
					}))

					const selection = await vscode.window.showQuickPick(items, {
						placeHolder: "Select a Harvest project",
					})
					if (!selection) {
						return // User canceled the selection
					}

					const config: TimerReminderConfig = {
						harvestProjectId: selection.projectId,
					}

					const workspaceFolders = vscode.workspace.workspaceFolders
					if (workspaceFolders && workspaceFolders.length > 0) {
						const configUri = timerReminderConfigPath(workspaceFolders[0].uri)
						await vscode.workspace.fs.writeFile(
							configUri,
							Buffer.from(JSON.stringify(config, null, 2), "utf8"),
						)

						self.send({
							type: "SET_PROJECT_CONFIG",
							harvestProjectId: selection.projectId,
						})

						vscode.window.showInformationMessage(`Project ${selection.label} has been set up.`)
					} else {
						throw new Error("No workspace folders found")
					}
				} catch (error) {
					vscode.window.showErrorMessage("Failed to fetch projects from Harvest API")
				}
			},
		},
	})
}

/**
 * could be it's own machine but it's a simple enough flow to just be a function
 */
async function promptUserForHarvestAccessToken(): Promise<HarvestConfig | undefined> {
	const steps = ["Open URL", "Enter API Token", "Enter Account ID"]
	let currentStep = 0
	let token: string | undefined
	let accountId: string | undefined

	while (currentStep < steps.length) {
		const step = steps[currentStep]
		let result: string | undefined

		if (step === "Open URL") {
			result = await vscode.window.showQuickPick(["Open URL", "Continue", "Cancel"], {
				placeHolder: step,
			})

			if (result === "Open URL") {
				vscode.env.openExternal(vscode.Uri.parse("https://id.getharvest.com/developers"))
				// Waiting for user confirmation to continue
				result = await vscode.window.showQuickPick(["Continue", "Cancel"], {
					placeHolder: `Have you created or found your API token?`,
				})
			}

			if (result === "Cancel") {
				return undefined
			}
		} else {
			result = await vscode.window.showQuickPick(["Continue", "Cancel"], {
				placeHolder: step,
			})

			if (result === "Cancel") {
				return undefined
			}

			if (step === "Enter API Token") {
				token = await vscode.window.showInputBox({
					prompt: "Enter your Harvest API key token",
					password: true,
				})
				if (!token) {
					return undefined
				}
			} else if (step === "Enter Account ID") {
				accountId = await vscode.window.showInputBox({
					prompt: "Enter your Harvest Account ID",
				})
				if (!accountId) {
					return undefined
				}
			}
		}

		currentStep++
	}

	if (token && accountId) {
		let resp = await harvestFetch({ token, accountId })(`https://api.harvestapp.com/v2/users/me`)

		if (!resp.ok) {
			throw new Error(`HTTP error! status: ${resp.status}`)
		}

		let me = meSchema.parse(await resp.json())

		return { token, accountId, userId: me.id }
	}

	return undefined
}
