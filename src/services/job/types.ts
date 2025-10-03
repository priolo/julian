
export type Job = {
	id?: string
	date: number
	dateRetry?: number
	timeoutId?: NodeJS.Timeout
	callback?: JobCallback
	state?: JOB_STATE
	metadata?: any
}

export type JobCallback = (job: Job) => Promise<JOB_STATE>

export enum JOB_STATE {
	PENDING = 1,
	SUCCESS,
	ABORT,
	RETRY,
	RETRY_FAIL
}

export enum Actions {
	ADD = "job:add",
	REMOVE = "job:remove"
}

export enum EventsLogs {
	JOB_END = "jobs:end"
}
