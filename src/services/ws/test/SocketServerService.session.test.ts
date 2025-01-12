import { RootService } from "../../../core/RootService.js"
import { getRandom, wait, wsFarm } from "../../../test_utils.js"
import * as wsNs from "../index.js"
import { getFreePort } from "../utils.js"



let PORT: number
let root: RootService

/**
 * Questo ROUTE-CUSTOM invia un messaggio "we are close" a tutti i CLIENTS che si trovano entro una certa distanza
 * da un CLIENT che ha inviato un messaggio "radar"
 */
class PluginSession extends wsNs.route {

	clientsCache: wsNs.IClient[] = []

	onConnect(client: wsNs.IClient) {
		super.onConnect(client)
		// se lo trovo tra quelli disconnessi allora gli mando i messaggi in cache
		let index = this.clientsCache.findIndex(c => c.params.id == client.params.id)
		if (index == -1) return
		const [cdel] = this.clientsCache.splice(index, 1)
		cdel["cache"].forEach((message: string) => this.sendToClient(client, message))
		cdel["cache"] = null

	}

	/**
	 * se il client si disconnette: creo la cache
	 */
	onDisconnect(client: wsNs.IClient) {
		super.onDisconnect(client)
		client["cache"] = []
		this.clientsCache.push(client)
	}

	onMessage(client: wsNs.IClient, message: string) {
		//super.onMessage(client, message)
		const msg = JSON.parse(message)
		if (msg.action == "to-all") {
			this.sendToAll(message)
		}
	}

	sendToClient(client: wsNs.IClient, message: string) {
		// il cleint è chiuso metto in cache
		if (client["cache"]) {
			client["cache"].push(message)
			// altrimenti lo mando regolarmente
		} else {
			super.sendToClient(client, message)
		}
	}

	getClients(): wsNs.IClient[] {
		return super.getClients().concat(this.clientsCache)
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
					class: PluginSession,
				},
			]
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("manage cache", async () => {

	// creo i clients
	const tmpIds: number[] = []
	const clients = await wsFarm(
		index => {
			tmpIds[index!] = getRandom(1, 9999)
			return `ws://localhost:${PORT}/?id=${tmpIds[index!]}`
		},
		3,
		(client, index) => client["id_session"] = tmpIds[index!]
	)

	// disconnetto un client
	const clientClose = clients[0]
	await new Promise((res, rej) => {
		clientClose.once("close", res)
		clientClose.close()
	})

	// // aspetto un po' altrimenti manda il messaggio prima di chiudere sul server
	await wait(100)

	// mando un messaggio a tutti
	const clientSend = clients[1]
	const txtOrigin = "messagge from: " + clientSend["id_session"]
	await new Promise<void>((res, rej) => {
		clientSend.once("message", res)
		clientSend.send(JSON.stringify({
			action: "to-all",
			payload: txtOrigin
		}))
	})

	// aspetto un po'
	await wait(100)

	// riconnetto il client disconnesso precedentemente
	let txtReceive
	await new Promise<void>(async (res, rej) => {
		const [clientRestore] = await wsFarm(() => `ws://localhost:${PORT}/?id=${clientClose["id_session"]}`, 1,
			(client) => {
				client.once("message", (message: string) => {
					const msg = JSON.parse(message)
					txtReceive = msg.payload
					res()
				})
			}
		)
	})

	expect(txtOrigin).toBe(txtReceive)
})

