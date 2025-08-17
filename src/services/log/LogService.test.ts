import { TypeLog } from "../../core/types.js"
import { RootService, log as logNs, types } from "../../index.js"



let root: RootService

beforeEach(async () => {
	root = await RootService.Start([
		<logNs.conf>{
			class: "log",
			exclude: [TypeLog.SYSTEM, TypeLog.FATAL, TypeLog.WARN],
			onParentLog: (log: types.ILog) => {
				if (['nc:init', 'nc:destroy', "ns:set-state"].includes(log.payload.type)) return false
			}
		},
	])
})

afterAll(async () => {
	if (!root) return
	await RootService.Stop(root)
})

test("creazione", async () => {
	// Quindi posso prelevare il SERVICE con il `PathFinder`
	// in questo caso la `path` è "/log"
	const log = root.nodeByPath<logNs.Service>("/log")
	expect(log instanceof logNs.Service).toBeTruthy()

})

test("log", async () => {

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
})

