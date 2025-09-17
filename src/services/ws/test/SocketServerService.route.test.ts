import WebSocket from "ws"
import { RootService } from "../../../core/RootService.js"
import * as wsNs from "../index.js"
import { getFreePort } from "../utils.js"



let PORT: number
let root: RootService

/**
 * non uso piu' il PATH
 */
beforeAll(async () => {
	PORT = await getFreePort()
	root = await RootService.Start(
		<wsNs.conf>{
			class: "ws",
			port: PORT,
			onLog: function (this: wsNs.Service, { name, payload }) {
				if (name !== wsNs.SocketLog.MESSAGE) return
				const { client, message }: { client: wsNs.IClient, message: string } = payload
				try {
					if (JSON.parse(message).path != null) return
				} catch (error) { }
				// this.sendToClient(client, `root::receive:${message}`)
			},
			children:<wsNs.SocketRouteConf[]> [
				{
					class: "ws/route",
					path: "command",
					onLog: function (this: wsNs.route, { name, payload }) {
						if (name !== wsNs.SocketLog.MESSAGE) return
						const client: wsNs.IClient = payload.client
						const message: string = payload.message.toString()

						try {
							if (JSON.parse(message).path != this.state.path) return
						} catch (error) { }
						this.sendToClient(client, `command::receive:${message}`)
					},
				},
				{
					class: "ws/route",
					path: "room1",
					children: [{
						class: "ws/route",
						path: "pos2",
						onLog: function (this: wsNs.route, { name, payload }) {
							if (name !== wsNs.SocketLog.MESSAGE) return
							const client: wsNs.IClient = payload.client
							const message: string = payload.message.toString()


							try {
								if (!(JSON.parse(message).path as string).endsWith(`/${this.state.path}`)) return
							} catch (error) { }
							this.sendToClient(client, `room1/pos2::receive:${message}`)
						},
					}],
				},
			]
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("su creazione", async () => {
	let srs = root.nodeByPath<wsNs.route>('/ws-server/{"path":"command"}')
	expect(srs).toBeInstanceOf(wsNs.route)
	srs = root.nodeByPath<wsNs.route>('/ws-server/{"path":"room1"}')
	expect(srs).toBeInstanceOf(wsNs.route)
})

test("message on subpath", async () => {
	let result: string[] = []

	// creo il client ws e sull'apertura mando dei dati
	const ws = new WebSocket(`ws://localhost:${PORT}/`)

	ws.on('open', () => {
		ws.send("only string")
		ws.send(JSON.stringify({
			path: "room1/pos2", action: "message",
			payload: { message: "<room1-pos2>" },
		}))
		ws.send(JSON.stringify({
			path: "command", action: "message",
			payload: { message: "<command>" },
		}))
	})

	// se ricevo una risposta la memorizzo
	ws.on('message', (message: string) => {
		result.push(message.toString())
		if (result.length == 5) ws.close()
	})

	// aspetto che il socket si chiuda
	await new Promise<void>((res, rej) => ws.on('close', res))

	expect(result).toEqual([
		`root::receive:only string`,
		`command::receive:only string`,
		`room1/pos2::receive:only string`,
		`room1/pos2::receive:{\"path\":\"room1/pos2\",\"action\":\"message\",\"payload\":{\"message\":\"<room1-pos2>\"}}`,
		`command::receive:{\"path\":\"command\",\"action\":\"message\",\"payload\":{\"message\":\"<command>\"}}`,
	])
})
