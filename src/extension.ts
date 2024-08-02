import * as vscode from "vscode"
import { createVsCodeActor } from "./actors/project-vscode-actor"

let teardown: (() => void) | undefined

export function activate(vsContext: vscode.ExtensionContext) {
	let actor = createVsCodeActor(vsContext)

	teardown = () => {
		actor.stop()
	}

	actor.start()

	vsContext.subscriptions.push(
		vscode.window.onDidChangeWindowState((e) => {
			if (e.focused) {
				actor.send({ type: "WINDOW_FOCUSED" })
			} else {
				actor.send({ type: "WINDOW_BLURRED" })
			}
		}),
	)

	vsContext.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			actor.send({ type: "WORKSPACE_FOLDERS_CHANGED" })
		}),
	)

	vsContext.subscriptions.push(
		vscode.commands.registerCommand("timer-reminder.projectSetup", () => {
			actor.send({ type: "REQUEST_PROJECT_SETUP" })
		}),
	)

	vsContext.subscriptions.push(
		vscode.commands.registerCommand("timer-reminder.setApiKey", () => {
			actor.send({ type: "REQUEST_API_SETUP" })
		}),
	)
}

export function deactivate() {
	if (teardown) {
		teardown()
	}
}
