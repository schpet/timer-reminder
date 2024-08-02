import { assign, setup } from "xstate"
import { type HarvestConfig } from "../harvest/harvest"
import { type TimeEntry } from "../harvest/harvest-api-schema"

type ProjectContext = {
	harvestAccessToken?: HarvestConfig
	projectId?: string
	activeTimer?: TimeEntry
	statusBarMessage: string
	isWarningShown: boolean
}

type ProjectEvent =
	| { type: "READ_PROJECT_CONFIG"; projectId?: string }
	| { type: "SET_PROJECT_CONFIG"; harvestProjectId: string }
	| { type: "CONFIG_READ_ERROR"; reason: string }
	| { type: "SET_API_KEY"; harvestAccessToken: HarvestConfig }
	| {
			type: "CHECK_TIMER"
			timeEntry?: TimeEntry
	  }
	| { type: "REQUEST_API_KEY" }
	| { type: "API_KEY_MISSING" }
	| { type: "API_KEY_DECLINED" }
	| { type: "API_SUCCESS" }
	| { type: "API_FAILURE" }
	| { type: "CONFIG_MISSING" }
	| { type: "CONFIG_INVALID" }
	| {
			type: "TIMER_RUNNING"
			timeEntry: TimeEntry
	  }
	| { type: "NO_TIMER_RUNNING" }
	| { type: "TIMER_OTHER_PROJECT" }
	| { type: "REQUEST_PROJECT_SETUP" }
	| { type: "PROJECT_SETUP_FINISHED" }
	| { type: "PROJECT_SETUP_ABANDONED" }
	| { type: "REQUEST_API_SETUP" }
	| { type: "API_SETUP_FINISHED" }
	| { type: "WINDOW_BLURRED" }
	| { type: "WINDOW_FOCUSED" }
	| { type: "WORKSPACE_FOLDERS_CHANGED" }

type ProjectActions = {
	readDurationsConfig: () => void
	readOrRequestApiKey: () => void
	checkTimer: () => void
	startProjectSetup: () => void
	removeApiKey: () => void
}

const projectMachine = setup({
	types: {
		context: {} as ProjectContext,
		events: {} as ProjectEvent,
	},
	guards: {
		hasRunningtimeEntry: ({ event }) => event.type === "CHECK_TIMER" && !!event.timeEntry,
		isCurrentProject: ({ context, event }) =>
			event.type === "CHECK_TIMER" && event.timeEntry?.project === context.projectId,
		hasApiKey: ({ context }) => !!context.harvestAccessToken,
	},
	actions: {} as ProjectActions,
}).createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AVmAxgFwDpUwBDCASwDsoAFDbfAYgGUBRAFQH0aAlAeQBSrAMJdhfAHIAxAJIBxANoAGALqIU6WOTzl0ldSAAeiAJwBmEwQCMVpSZsAWAExKA7FacmANCACeiJysANgIzAA4gpyCw11cHMyUg1wBfZJ80LFxCYjIqWnosxnFpeU4eVgBBABFOVh5+HmU1JBBkTW1dfRbjBABWMKsCVyUrMKUnMJM3VyCzH38EM16Q3ocY4Omg2atU9IL8AhwAC1wAazyK5HIAaTBfFg5OCpoZTmvWAE0mgzatHT0DD1wg4huZgmYzA5essnK45n5EFYTK4CHYnP1elE3FMTA5dq19oRjmcLldbvdnq93h9OABZGTMZgyCSKVQ-dr-LqgHqeAhQ2zQyFWGYY+YBJGhZywsIOYIeVa9fEZBhEk44c7US43O6MSlvT6cKoiAAyzNYVW+LV+HQB3URVjMBDBst6ZgmjghYoQUUdMWGZlirqs8TMSsJhzVGqgWvJjEtGj+nUBiGhgzGwd6SOhSgDXoFBCC8QiYQsmdhhbDmQOxPVpO19wUVmaCZtXKMiDhvWsgtGNgikKCeaUXcL4WipY8MzxaQJVcIOgAtmBUDJKCR8OQAG5gIoACRE1047BktLq8daHKTdoQwRLfJsMJMk0LrjCXvRKMDCRMmYdSVxlYqgQi7Lqu646NujCGLAeAkHgYAECQABm8GoAAFAkShYQAlIwypZMB5BLiua4btu57WpyyY3q6SgFnEOavp4DixF6DjDgQ-SJJiuJTAkQSAQRNZRuwRHLowx6njwZQAKoSBIzKss2F6Jra3KIsiIKzDMQTBsGQpev0lhOAGIz9A6jgmIJ1aRnkonEYwEh8EeJ51LJ8mKRRl5qe2N4BiiDiyiYkRBMFooIggUIoiYsITG6MomOYTjWaqJLUPZ4mSW5fDsPu0m8IIIjsF5qltjynh0a4yJuGEvRKPEg4RSZlg2B4QTLDMYROFCKWEcRFRkTuwj7sIh5ZY0bJWt5ZWIl1WmvqF0QxQG8ILKsliJEWoUChYAkzvhBwgagA0QTu0GwfBiEocuGFYXduEHfOYnHYNJWttRwSFqiAxmBs5k-g4hndaiVhBhCFgWCMvVHXweAnKgdBznuB4uVJb1UdeLi2Jx6LBYluJjMi74sUMsIJKDZjRHYcLQ89sPw4jKpQTBcEIchqG3XdSgPeGMNw8ujNZOjV7qd6D6cc4lORKM0Rer9dH1a4LiugkcJLHtexzgQC7kLAWiamSOrlAAijJrDMFwerUsLPk9AAtJO1huNEwq-kkjULL9I5QoWyJTO1P6KvilDoBAcA-IS7KldRDuuF2tida7Nju16dtQqidhbMsmKypT06a0BOQUNQgv4FH73XssliU7EAxOCZJnhO+oMFkoAxrKFVVjGEYS9SHpd4OXGOi5EljRF+PexDmVhA2E96Q66iUDKDvXCXW5JDyLvm1fRwpL3H0TdTPEXON97E95EPfDvEvU63r693JvtumI65b2MOLizCZcsRJx-aBMKX6kQer7V5s9MCg0n4zRvOiR0HgsKExcJDD2ARgb11lDKaEVUtjDlXrZdKz0oEfUSnA-iDgki9HcKDXobF2KogsMMJEXUbCJVpv1SBU1o7XmFErUIr5EhKwoexGhEVR70PIexYY9VkShlAVrPmDNI6cIrqLLGLUYgDDiLYWY0IvTIglow8YzgWLBWnKkIAA */
	id: "project",
	initial: "checkingApiKey",
	context: {
		statusBarMessage: "initializing",
		isWarningShown: false,
	},
	on: {
		REQUEST_API_SETUP: {
			target: ".checkingApiKey",
			actions: {
				type: "removeApiKey",
			},
			reenter: true,
		},
		REQUEST_PROJECT_SETUP: {
			target: ".projectSetup",
			reenter: true,
		},
		WINDOW_BLURRED: {
			target: ".windowInBackground",
		},
		WINDOW_FOCUSED: [
			{
				target: ".checkingTimer",
				guard: ({ context }) => !!context.projectId,
			},
			{
				target: ".noProject",
			},
		],
		WORKSPACE_FOLDERS_CHANGED: {
			target: ".readingProject",
			reenter: true,
		},
		SET_PROJECT_CONFIG: {
			target: ".checkingTimer",

			actions: assign({
				projectId: ({ event }) => event.harvestProjectId,
			}),

			reenter: true,
		},
	},
	states: {
		readingProject: {
			entry: [
				{
					type: "readDurationsConfig",
				},
				assign({ statusBarMessage: "reading config" }),
			],
			on: {
				CONFIG_READ_ERROR: {
					target: "noProject",
				},
			},
		},
		noProject: {
			entry: assign({
				statusBarMessage: "no project",
				isWarningShown: false,
			}),
		},
		checkingApiKey: {
			always: [
				{
					target: "readingProject",
					guard: "hasApiKey",
					reenter: true,
				},
				{
					target: "checkingApiKey",
				},
			],
			entry: [{ type: "readOrRequestApiKey" }, assign({ statusBarMessage: "checking key" })],
			on: {
				SET_API_KEY: {
					target: "readingProject",
					actions: assign({
						harvestAccessToken: ({ event }) => event.harvestAccessToken,
					}),
				},
				API_KEY_MISSING: {
					target: "missingApiKey",
				},
				API_KEY_DECLINED: {
					target: "missingApiKey",
				},
			},
		},

		missingApiKey: {
			entry: assign({ statusBarMessage: "key missing" }),
			on: {
				REQUEST_API_SETUP: "checkingApiKey",
				REQUEST_API_KEY: "checkingApiKey",
			},
		},

		timerInactive: {
			entry: assign({
				statusBarMessage: "not running",
				isWarningShown: true,
			}),
			after: {
				30000: { target: "checkingTimer" },
			},
			on: {
				CHECK_TIMER: { target: "checkingTimer" },
			},
		},

		checkingTimer: {
			entry: ["checkTimer", assign({ statusBarMessage: "checking timer" })],
			on: {
				TIMER_RUNNING: {
					target: "timerActive",
					actions: assign({
						activeTimer: ({ event }) => event.timeEntry,
					}),
				},
				NO_TIMER_RUNNING: "timerInactive",
				TIMER_OTHER_PROJECT: "timerOtherProject",
			},
		},

		timerActive: {
			entry: assign({
				statusBarMessage: "timer active",
				isWarningShown: false,
			}),
			after: {
				30000: { target: "checkingTimer" },
			},
			on: {
				CHECK_TIMER: { target: "checkingTimer" },
			},
		},

		timerOtherProject: {
			entry: assign({
				statusBarMessage: "other project",
				isWarningShown: true,
			}),
			after: {
				30000: { target: "checkingTimer" },
			},
			on: {
				CHECK_TIMER: { target: "checkingTimer" },
			},
		},

		projectSetup: {
			entry: [{ type: "startProjectSetup" }, assign({ statusBarMessage: "setup project" })],
			on: {
				PROJECT_SETUP_ABANDONED: "noProject",
			},
		},

		windowInBackground: {
			entry: assign({ statusBarMessage: "background" }),
		},
	},
})

export default projectMachine
