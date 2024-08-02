import z from "zod"

const clientSchema = z.object({
	id: z.number(),
	name: z.string(),
	currency: z.string(),
})

const projectSchema = z.object({
	id: z.number(),
	name: z.string(),
	code: z.nullable(z.string()),
})
export type Project = z.infer<typeof projectSchema>

const timeEntrySchema = z.object({
	id: z.number(),
	spent_date: z.string(),
	hours: z.number(),
	hours_without_timer: z.number(),
	rounded_hours: z.number(),
	notes: z.nullable(z.string()),
	timer_started_at: z.string(),
	started_time: z.string().nullable(),
	ended_time: z.string().nullable(),
	is_running: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	client: clientSchema,
	project: projectSchema,
})
export type TimeEntry = z.infer<typeof timeEntrySchema>

export const timeEntriesResponseSchema = z.object({
	time_entries: z.array(timeEntrySchema),
	per_page: z.number(),
	total_pages: z.number(),
	total_entries: z.number(),
	next_page: z.nullable(z.string()),
	previous_page: z.nullable(z.string()),
	page: z.number(),
	links: z.object({
		first: z.string(),
		next: z.nullable(z.string()),
		previous: z.nullable(z.string()),
		last: z.string(),
	}),
})

const projectAssignmentSchema = z.object({
	id: z.number(),
	is_active: z.boolean(),
	is_project_manager: z.boolean(),
	use_default_rates: z.boolean(),
	hourly_rate: z.number().nullable(),
	budget: z.number().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	project: projectSchema,
})

export const projectAssignmentsResponseSchema = z.object({
	project_assignments: z.array(projectAssignmentSchema),
	per_page: z.number(),
	total_pages: z.number(),
	total_entries: z.number(),
	next_page: z.nullable(z.number()),
	previous_page: z.nullable(z.number()),
	page: z.number(),
})

export const meSchema = z.object({
	id: z.number(),
})
