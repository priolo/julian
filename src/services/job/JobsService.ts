import { randomUUID } from "crypto"
import dayjs from "dayjs"
import { ServiceBase } from "../../core/ServiceBase.js"
import { TypeLog } from "../../core/types.js"
import { Job, Actions, JOB_STATE, EventsLogs } from "./types.js"




export type JobsServiceConf = Partial<JobsService['stateDefault']>

/**
 * - Servizio per la gestione di JOBS
 * - Permette di schedulare JOBS con callback asincrone
 * - Permette di gestire i retry in caso di errori
 */
export class JobsService extends ServiceBase {

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "jobs",

			retryDelta: 1000 * 60 * 5, // 5 minuti
			retryMaxDelay: 1000 * 60 * 60 * 24, // 24 ore
			jobs: [] as Job[],
			onJobsLoad: null as () => Promise<Job[]>,
			onJobEnd: null as (job: Job) => void,
		}
	}

	get executablesMap() {
		return {
			...super.executablesMap,
			[Actions.ADD]: ( job:Job ) => this.addJob(job),
			[Actions.REMOVE]: (jobId: string) => this.removeJob(jobId),
		}
	}




	protected async onInitAfter(): Promise<void> {
		await super.onInitAfter()
		const jobs = (await this.state.onJobsLoad?.() ?? [])
		jobs.forEach(job => this.addJob(job))
	}

	getJob(jobId: string) {
		return this.state.jobs.find(s => s.id === jobId)
	}

	addJob(job: Job) {
		if (!job.callback) return this.log("JOB", `Cannot add job without callback`, TypeLog.ERROR)
		if (!!job.dateRetry && job.dateRetry < Date.now()) {
			return this.log("JOB", `Invalid dateRetry: (${dayjs(job.dateRetry).format("YYYY-MM-DD HH:mm:ss")})`, TypeLog.ERROR)
		}
		if (!job.date || (!job.dateRetry && job.date < Date.now())) {
			return this.log("JOB", `Invalid date: (${dayjs(job.date).format("YYYY-MM-DD HH:mm:ss")})`, TypeLog.ERROR)
		}

		if (!job.state) job.state = JOB_STATE.PENDING			
		if (!job.id) job.id = randomUUID()

		const date = job.dateRetry ?? job.date
		if (!!job.timeoutId) clearTimeout(job.timeoutId)
		job.timeoutId = setTimeout(
			() => this.executeJob(job.id),
			date - Date.now()
		)

		if (!this.getJob(job.id)) this.state.jobs.push(job)
		this.setState({ jobs: this.state.jobs })
	}

	removeJob(jobId: string) {
		const job = this.getJob(jobId)
		if (!job) return this.log("JOB", `Cannot remove job ${jobId}, not found`, TypeLog.ERROR)

		if (!!job.timeoutId) clearTimeout(job.timeoutId)
		this.state.jobs = this.state.jobs.filter(s => s.id !== jobId)
		this.setState({ jobs: this.state.jobs })
	}





	// restoreJob(job: Job) {
	// 	if (!job.id) return this.log("JOB", `Cannot restore job without ID`, TypeLog.ERROR)
	// 	if (this.getJob(job.id)) return this.log("JOB", `Cannot restore job ${job.id}, already exists`, TypeLog.ERROR)
	// 	if (job.state !== JOB_STATE.PENDING) return this.log("JOB", `Cannot restore job ${job.id}, state is not PENDING`, TypeLog.ERROR)
	// 	if (job.date < Date.now()) return this.log("JOB", `Cannot restore job in the past (${dayjs(job.date).format("YYYY-MM-DD HH:mm:ss")})`, TypeLog.ERROR)
	// 	if (!!job.dateRetry && job.dateRetry < Date.now()) return this.log("JOB", `Cannot restore job with retry in the past (${dayjs(job.dateRetry).format("YYYY-MM-DD HH:mm:ss")})`, TypeLog.ERROR)
	// 	this.addJob(job)
	// }

	// pauseJob(job: Job) {
	// 	if (!job.id) return this.log("JOB", `Cannot pause job without ID`, TypeLog.ERROR)
	// 	const existing = this.getJob(job.id)
	// 	if (!existing) return this.log("JOB", `Cannot pause job ${job.id}, not found`, TypeLog.ERROR)
	// 	if (existing.state !== JOB_STATE.PENDING) return this.log("JOB", `Cannot pause job ${job.id}, state is not PENDING`, TypeLog.ERROR)
	// }







	async executeJob(jobId: string) {
		const job = this.getJob(jobId)
		if (!job) return this.log("JOB", `Cannot execute job ${jobId}, not found`, TypeLog.ERROR)
		this.removeJob(jobId)

		// se non c'e' qualche parametro c'e' un problema
		if (!job.date || !job.callback || !job.state) {
			this.log("JOB", `job missing parameters, aborting`)
			job.state = JOB_STATE.ABORT
			this.onJobEnd(job)
			return
		}

		// eseguo il JOB
		const newState = await job.callback(job)

		// se è RETRY setto il retry date
		if (newState == JOB_STATE.RETRY) {
			job.dateRetry = Date.now() + this.state.retryDelta
			const maxRetryTime = job.date + this.state.retryMaxDelay

			if (job.dateRetry > maxRetryTime) {
				this.log("JOB", `job reached max retry time, aborting`)
				job.state = JOB_STATE.RETRY_FAIL
				this.onJobEnd(job)

			} else {
				this.addJob(job)
			}

		} else if (newState == JOB_STATE.SUCCESS) {
			job.state = JOB_STATE.SUCCESS
			this.onJobEnd(job)

		} else if (newState == JOB_STATE.ABORT) {
			job.state = JOB_STATE.ABORT
			this.onJobEnd(job)
		}
	}

	onJobEnd(job: Job) {
		this.state.onJobEnd?.(job)
		this.log(EventsLogs.JOB_END, job, TypeLog.EVENT)
	}
}


