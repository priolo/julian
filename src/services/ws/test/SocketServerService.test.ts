import { WebSocket } from "ws"
import { RootService } from "../../../core/RootService.js"
import * as wsNs from "../index.js"
import { SocketServerConf } from "../SocketServerService.js"
import { getFreePort } from "../utils.js"



let PORT: number = 52
let root: RootService

beforeAll(async () => {
	PORT = await getFreePort()
	root = await RootService.Start(
		<SocketServerConf>{
			class: "ws",
			port: PORT,
			children: [
				{
					class: "ws/route",
					onLog: async function ({ name, payload }) {
						if ( name !== wsNs.SocketLog.MESSAGE ) return
						const { client, message } = payload as { client: wsNs.IClient, message: string }
						
						await this.execute({
							type: wsNs.SocketRouteActions.SEND,
							payload: { client, message }
						})
						await this.execute({
							type: wsNs.SocketRouteActions.DISCONNECT,
							payload: client
						})
					},
				}
			],
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})


test("su creazione", async () => {
	const wss = root.nodeByPath<wsNs.Service>("/ws-server")!
	expect(wss).toBeInstanceOf(wsNs.Service)
})

test("client connect/send/close", async () => {
	const dateNow = Date.now().toString()
	const ws = new WebSocket(`ws://localhost:${PORT}/`);
	const result = await new Promise<string>((res, rej) => {
		let result
		ws.on('open', function open() {
			ws.send(dateNow.toString())
		});
		ws.on('message', (data: ArrayBuffer) => {
			result = data.toString()
		});
		ws.on('close', function close() {
			res(result)
		});
	})

	expect(dateNow).toBe(result)

}, 1000000)
