import * as vscode from "vscode"
import z from "zod"

export const timerReminderConfigSchema = z.object({
	harvestProjectId: z.string(),
})
export type TimerReminderConfig = z.infer<typeof timerReminderConfigSchema>

export const timerReminderConfigPath = (base: vscode.Uri) =>
	vscode.Uri.joinPath(base, ".config", "timer-reminder.json")

/**
 * loads the .config/timer-reminder.json config from the first workspace, an
 * arbitrary choice if you happen to have multiple workspaces open
 */
export const loadTimerReminderConfigFromWorkspace = async (): Promise<TimerReminderConfig> => {
	const workspaceFolders = vscode.workspace.workspaceFolders
	if (workspaceFolders && workspaceFolders.length > 0) {
		const configPath = timerReminderConfigPath(workspaceFolders[0].uri)
		const fs = vscode.workspace.fs
		const configData = await fs.readFile(configPath)
		const configString = Buffer.from(configData).toString("utf8")

		let config
		try {
			config = JSON.parse(configString)
		} catch (er) {
			throw new Error("Failed to parse config as JSON")
		}

		let validatedConfig = timerReminderConfigSchema.parse(config)

		return validatedConfig
	}

	throw new Error("No workspace folders found")
}
