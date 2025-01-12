import { TypeLog } from "../../core/node/types.js"
import { PathFinder, RootService, log as logNs, types } from "../../index.js"



let root: RootService

beforeEach(async () => {
	root = await RootService.Start([
		<logNs.conf>{ class: "log", levels: [TypeLog.FATAL, TypeLog.WARN] },
	])
})

afterAll(async () => {
	if (!root) return
	await RootService.Stop(root)
})

/**

 */
test("creazione", async () => {
	/**
	 * E' possibile quindi chiamare questo servizio e generare dei log
	 * in base ai `LogTransportService` definiti come children  
	 */
	// Quindi posso prelevare il SERVICE con il `PathFinder`
	// in questo caso la `path` è "/log"
	const log = new PathFinder(root).getNode<logNs.Service>("/log")
	expect(log instanceof logNs.Service).toBeTruthy()

})

test("log", async () => {
	root.emitter.emit("log-fatal", <types.ILog>{ name: "log-fatal", payload: "oh my god!", type: types.TypeLog.FATAL })
	root.emitter.emit("log-info", <types.ILog>{ name: "log-info", payload: "info!", type: types.TypeLog.INFO })
})

