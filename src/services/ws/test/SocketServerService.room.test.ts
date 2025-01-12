import { PathFinder } from "../../../core/path/PathFinder.js"
import { RootService } from "../../../core/RootService.js"
import { wsFarm } from "../../../test_utils.js"
import * as wsNs from "../index.js"
import { getFreePort } from "../utils.js"



let PORT:number
let root:RootService

class RouteCustom extends wsNs.route {

	onMessage(client: wsNs.IClient, msg: string) {
		const message = JSON.parse(msg)
		if ( message.path != this.state.path ) return

		if (message.action == "enter") {
			const rooms: Set<string> = !client["rooms"] ? client["rooms"] = new Set<string>() : client["rooms"]
			rooms.add(this.state.path)
			client["id"] = message.payload
			this.sendToAll(JSON.stringify({
				action: "enter",
			}))

		} else if (message.action == "exit") {
			const rooms = <Set<string>>client?.["rooms"]
			rooms?.delete(this.state.path)
			this.sendToAll(JSON.stringify({
				action: "exit",

			}))
		} else if (message.action == "list") {
			const clients = this.getClients().map(client => client["id"])
			this.sendToAll(JSON.stringify({
				action: "list",
				clients
			}))
		}
	}

	getClients(): wsNs.IClient[] {
		const { path } = this.state
		const clients = super.getClients()
		return clients.filter(client => {
			const rooms = <Set<string>>client?.["rooms"]
			return rooms ? rooms.has(path) : false
		})
	}

}

beforeAll(async () => {
	PORT = await getFreePort()
	root = await RootService.Start(
		{
			class: "ws",
			port: PORT,
			children: [
				{
					class: RouteCustom,
					path: "room1",
				},
				{
					class: RouteCustom,
					path: "room2",
				}
			]
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("su creazione", async () => {
	let srs = new PathFinder(root).getNode<wsNs.route>('/ws-server/{"path":"room1"}')
	expect(srs).toBeInstanceOf(wsNs.route)
	srs = new PathFinder(root).getNode<wsNs.route>('/ws-server/{"path":"room2"}')
	expect(srs).toBeInstanceOf(wsNs.route)
})

test("verifica route custom con gestione delle ROOM", async () => {
	// creo 5 CLIENTS
	const clientsLength = 5
	const clients = await wsFarm(`ws://localhost:${PORT}/`, clientsLength)
	const clientInRoom1 = clients.slice(0, 3)

	// i primi 3 entrano nella room1
	await Promise.all(clientInRoom1.map((client, index) => new Promise<void>((res, rej) => {

		client.send(JSON.stringify({ path: "room1", action: "enter", payload: index }))

		client.once('message', (message: string) => {
			const msg = JSON.parse(message)
			if (msg.action == "enter") res()
		})

	})))

	// get list in room1
	const res = await new Promise<any>((res, rej) => {
		const client = clients[0]
		client.send(JSON.stringify({ path: "room1", action: "list" }))
		client.once('message', (message: string) => {
			const msg = JSON.parse(message)
			if (msg.action == "list") res(msg)
		})
	})

	expect(res.action).toBe("list")
	expect(res.clients).toEqual(clientInRoom1.map((client, index)=>index))
})

type Message = {
	path: string
	action: string
	payload?: any
}