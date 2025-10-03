
import { Job, Actions, JOB_STATE, EventsLogs } from "./types.js"
import { JobsService, JobsServiceConf } from "./JobsService.js"
import { RootService } from "../../core/RootService.js"
import { Bus } from "../../core/path/Bus.js"


describe("jobs scheduling", () => {

	let jobs: Job[] = []

	beforeEach(async () => {
		jobs = [
			{
				date: Date.now() + 100,
				metadata: { name: "job1", counter: 0 },
			},
			{
				date: Date.now() + 200,
				metadata: { name: "job2", counter: -1 },
			},
			{
				date: Date.now() + 300,
				metadata: { name: "job3", counter: 1 },
			},
		]
	})

	afterAll(async () => {
	})

	test("check scheduling", async () => {

		const completedJobs: Job[] = []
		const callback = async (job: Job): Promise<JOB_STATE> => {
			const count = job.metadata.counter
			if (count == 0) return JOB_STATE.SUCCESS
			if (count < 0) return JOB_STATE.ABORT
			job.metadata.counter--
			return JOB_STATE.RETRY
		}

		const root = await RootService.Start([
			<JobsServiceConf>{
				class: JobsService,
				retryDelta: 100, // Reduce retry delay for testing
				onJobsLoad: async () => jobs.map(j => ({
					...j,
					callback,
				})),
				onJobEnd: (job) => {
					completedJobs.push(job)
				}
			},
		])

		const jobsService = root.nodeByPath<JobsService>("/jobs")
		expect(jobsService).toBeDefined()

		// Initially should have 3 jobs scheduled
		expect(jobsService!.state.jobs.length).toBe(3)

		// Wait for all jobs to complete (job3 might retry, so wait longer)
		await new Promise(resolve => setTimeout(resolve, 1000))

		// All jobs should be completed
		expect(completedJobs.length).toBe(3)

		// Check job1 - should succeed immediately
		const job1 = completedJobs.find(j => j.metadata.name === "job1")
		expect(job1).toBeDefined()
		expect(job1!.state).toBe(JOB_STATE.SUCCESS)
		expect(job1!.metadata.counter).toBe(0)

		// Check job2 - should abort immediately  
		const job2 = completedJobs.find(j => j.metadata.name === "job2")
		expect(job2).toBeDefined()
		expect(job2!.state).toBe(JOB_STATE.ABORT)
		expect(job2!.metadata.counter).toBe(-1)

		// Check job3 - should retry once then succeed
		const job3 = completedJobs.find(j => j.metadata.name === "job3")
		expect(job3).toBeDefined()
		expect(job3!.state).toBe(JOB_STATE.SUCCESS)
		expect(job3!.metadata.counter).toBe(0)

		// No jobs should remain in the queue
		expect(jobsService!.state.jobs.length).toBe(0)

		// Clean up any remaining timeouts
		for (const job of jobsService!.state.jobs) {
			if (job.timeoutId) {
				clearTimeout(job.timeoutId)
			}
		}
	}, 10000)

	test("check scheduling", async () => {

		const completedJobs: Job[] = []

		const root = await RootService.Start([
			<JobsServiceConf>{
				class: JobsService,
				retryDelta: 100,
			},
		])

		const jobsService = root.nodeByPath<JobsService>("/jobs")
		expect(jobsService).toBeDefined()

		const callback = async (job: Job): Promise<JOB_STATE> => {
			const count = job.metadata.counter
			if (count == 0) return JOB_STATE.SUCCESS
			if (count < 0) return JOB_STATE.ABORT
			job.metadata.counter--
			return JOB_STATE.RETRY
		}

		jobs.forEach(j => {
			new Bus(root, "/jobs").dispatch({
				type: Actions.ADD,
				payload: {
					...j,
					callback,
				} as Job,
			})
		})

		root.emitter.on(EventsLogs.JOB_END, msg => {
			const job = msg.payload.payload as Job
			completedJobs.push(job)
		})

		// Initially should have 3 jobs scheduled
		expect(jobsService!.state.jobs.length).toBe(3)

		// Wait for all jobs to complete (job3 might retry, so wait longer)
		await new Promise(resolve => setTimeout(resolve, 1000))

		// All jobs should be completed
		expect(completedJobs.length).toBe(3)

		// Check job1 - should succeed immediately
		const job1 = completedJobs.find(j => j.metadata.name === "job1")
		expect(job1).toBeDefined()
		expect(job1!.state).toBe(JOB_STATE.SUCCESS)
		expect(job1!.metadata.counter).toBe(0)

		// Check job2 - should abort immediately  
		const job2 = completedJobs.find(j => j.metadata.name === "job2")
		expect(job2).toBeDefined()
		expect(job2!.state).toBe(JOB_STATE.ABORT)
		expect(job2!.metadata.counter).toBe(-1)

		// Check job3 - should retry once then succeed
		const job3 = completedJobs.find(j => j.metadata.name === "job3")
		expect(job3).toBeDefined()
		expect(job3!.state).toBe(JOB_STATE.SUCCESS)
		expect(job3!.metadata.counter).toBe(0)

		// No jobs should remain in the queue
		expect(jobsService!.state.jobs.length).toBe(0)

		// Clean up any remaining timeouts
		for (const job of jobsService!.state.jobs) {
			if (job.timeoutId) {
				clearTimeout(job.timeoutId)
			}
		}
	}, 10000)


})