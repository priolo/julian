import { TypeLog } from "../../core/types.js"
import { RootService, log as logNs, types } from "../../index.js"



beforeEach(async () => {
})

afterAll(async () => {
})


test("log exclude", async () => {

	const results:any[] = []

	const root = await RootService.Start([
		<logNs.conf>{
			class: "log",
			exclude: [TypeLog.SYSTEM, TypeLog.FATAL, TypeLog.WARN],
			onParentLog: (log: types.ILog) => {
				if (['nc:init', 'nc:destroy', "ns:set-state"].includes(log.payload.type)) return false
				results.push(log)
			}
		},
	])

	root.emitter.emit(
		"log-fatal",
		<types.ILog>{
			name: "log-fatal",
			payload: "oh my god!",
			type: types.TypeLog.FATAL
		}
	)

	root.emitter.emit(
		"log-info",
		<types.ILog>{
			name: "log-info",
			payload: "info!",
			type: types.TypeLog.INFO
		}
	)

	await RootService.Stop(root)

	expect(results.length).toBe(1)
	expect(results[0].name).toBe(types.TypeLog.INFO)
})


test("log include", async () => {

	const results:any[] = []

	const root = await RootService.Start([
		<logNs.conf>{
			class: "log",
			include: [TypeLog.ERROR],
			onParentLog: (log: types.ILog) => {
				results.push(log)
			}
		},
	])

	root.emitter.emit(
		"log-fatal",
		<types.ILog>{
			name: "log-fatal",
			payload: "oh my god!",
			type: types.TypeLog.FATAL
		}
	)

	root.emitter.emit(
		"log-info",
		<types.ILog>{
			name: "log-info",
			payload: "info!",
			type: types.TypeLog.INFO
		}
	)

	root.emitter.emit(
		"log-error",
		<types.ILog>{
			name: "log-error",
			payload: "ERROR!",
			type: types.TypeLog.ERROR
		}
	)

	await RootService.Stop(root)

	expect(results.length).toBe(1)
	expect(results[0].type).toBe(types.TypeLog.ERROR)
})
