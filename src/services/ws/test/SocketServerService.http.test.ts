import WebSocket from "ws"
import { PathFinder } from "../../../core/path/PathFinder.js"
import { RootService } from "../../../core/RootService.js"
import * as wsNs from "../index.js"
import { getFreePort } from "../utils.js"



let PORT: number
let root: RootService


beforeAll(async () => {
	PORT = await getFreePort()
	root = await RootService.Start(
		{
			class: "http",
			port: PORT,
			children: [
				{
					class: "ws",
					name: "ws1",
					path: "server1",
					onMessage: async function (client, message) {
						this.sendToClient(client, "from ws1")
						this.disconnectClient(client)
					},
				},
				{
					class: "ws",
					name: "ws2",
					path: "/server2",
					onMessage: async function (client, message) {
						this.sendToClient(client, "from ws2")
						this.disconnectClient(client)
					},
				}
			]
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})


test("su creazione", async () => {
	const ws1 = new PathFinder(root).getNode<wsNs.Service>("/http/ws1")
	expect(ws1).toBeInstanceOf(wsNs.Service)
	const ws2 = new PathFinder(root).getNode<wsNs.Service>("/http/ws2")
	expect(ws2).toBeInstanceOf(wsNs.Service)
})

test("verifica connetc/send/close su servizio WS montato su servizio HTTP ", async () => {

	let client = new WebSocket(`ws://localhost:${PORT}/server1`)
	let result = await new Promise<string>((res, rej) => {
		let result
		client.on('open', function open() {
			client.send("from client1")
		})
		client.on('message', (data) => {
			result = data
		})
		client.on('close', function close() {
			res(result)
		})
	})
	expect(result).toBe("from ws1")


	client = new WebSocket(`ws://localhost:${PORT}/server2`);
	result = await new Promise((res, rej) => {
		let result
		client.on('open', function open() {
			client.send("from client2")
		})
		client.on('message', (data) => {
			result = data
		})
		client.on('close', function close() {
			res(result)
		})

	})
	expect(result).toBe("from ws2")

})