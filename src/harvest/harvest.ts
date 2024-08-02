import z from "zod"
import {
	Project,
	projectAssignmentsResponseSchema,
	timeEntriesResponseSchema,
} from "./harvest-api-schema"

// this is persisted in the vscode secrets store
export const harvestConfigSchema = z.object({
	token: z.string(),
	accountId: z.string(),
	userId: z.number(),
})
export type HarvestConfig = z.infer<typeof harvestConfigSchema>

export class HarvestApi {
	accessToken: HarvestConfig
	fetch

	constructor(accessToken: HarvestConfig) {
		this.accessToken = accessToken
		this.fetch = harvestFetch(accessToken)
	}

	async request(...args: Parameters<typeof fetch>) {
		const response = await this.fetch(...args)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return response.json()
	}

	async fetchTimeEntriesRunning() {
		const data = await this.request(
			`https://api.harvestapp.com/v2/time_entries?is_running=true&user_id=${this.accessToken.userId}`,
		)
		const parsed = timeEntriesResponseSchema.parse(data)
		return parsed.time_entries
	}

	async fetchProjects(): Promise<Project[]> {
		const data = await this.request("https://api.harvestapp.com/v2/users/me/project_assignments")
		const parsed = projectAssignmentsResponseSchema.parse(data)
		return parsed.project_assignments.map((assignment) => assignment.project)
	}

	async fetchCurrentlyAuthenticatedUser(): Promise<{ id: number }> {
		const data = await this.request("https://api.harvestapp.com/v2/users/me")
		return data as { id: number }
	}
}

export const harvestFetch = ({ accountId, token }: Pick<HarvestConfig, "token" | "accountId">) => {
	return (...args: Parameters<typeof fetch>) => {
		let [url, options] = args
		let optsWithHeaders = {
			...options,
			headers: {
				...options?.headers,
				Authorization: `Bearer ${token}`,
				"Harvest-Account-Id": accountId,
				"User-Agent": "VSCode Timer Reminder Extension",
			},
		}
		return fetch(url, optsWithHeaders)
	}
}
