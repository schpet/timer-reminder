import * as vscode from "vscode"
import { createActor } from "xstate"
import { vscodeProjectMachine } from "../machines/project-machine-vscode"

export function createVsCodeActor(vsContext: vscode.ExtensionContext) {
	let actor = createActor(vscodeProjectMachine(vsContext))

	actor.subscribe((snapshot) => {
		vscode.window.setStatusBarMessage(`Timer: ${snapshot.context.statusBarMessage}`)

		const configuration = vscode.workspace.getConfiguration()

		const colors: Record<string, string> = {
			orange: "#fa5d00",
			white: "#ffffff",
		}

		const elementsToColor: Record<string, string> = {
			"editorCursor.foreground": colors.orange,
			"statusBar.background": colors.orange,
			"statusBar.foreground": colors.white,
		}

		let isCheckingTimer = snapshot.matches("checkingTimer")

		if (snapshot.context.isWarningShown) {
			configuration.update(
				"workbench.colorCustomizations",
				elementsToColor,
				vscode.ConfigurationTarget.Workspace,
			)
		} else if (!isCheckingTimer) {
			const colorCustomizations: Record<string, undefined> = {}
			for (const element of Object.keys(elementsToColor)) {
				colorCustomizations[element] = undefined
			}

			configuration.update(
				"workbench.colorCustomizations",
				colorCustomizations,
				vscode.ConfigurationTarget.Workspace,
			)
		}
	})

	return actor
}
