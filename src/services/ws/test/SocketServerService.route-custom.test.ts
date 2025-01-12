import { RootService } from "../../../core/RootService.js"
import { distancePoints, getRandom, wsFarm, wait } from "../../../test_utils.js"
import * as wsNs from "../index.js"
import { getFreePort } from "../utils.js"



let PORT: number
let root: RootService

/**
 * Questo ROUTE-CUSTOM invia un messaggio "we are close" a tutti i CLIENTS che si trovano entro una certa distanza
 * da un CLIENT che ha inviato un messaggio "radar"
 */
class RouteCustom extends wsNs.route {
	onMessage(client: wsNs.IClient, msg: string) {
		const message = JSON.parse(msg)
		if (message.action == "position") {
			client["position"] = message.payload
		} else if (message.action == "radar") {
			const distance = message.payload
			const clients = this.getClients()
				.filter(c => distancePoints(c["position"], client["position"]) <= distance)
				.forEach(c => this.sendToClient(c, "we are close"))
		}
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
					path: "near",
				},
			]
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("send send/receive position near", async () => {

	// la distanza entro cui un CLIENT riceve il messaggio "we are close"
	const distance = 10
	// genero 50 posizioni casuali
	const positions = Array.from<any, { x: number, y: number }>({ length: 50 }, _ => ({ x: getRandom(1, 100), y: getRandom(1, 100) }))
	// l'indice della posizione che manderà il messaggio "radar"
	const senderIndex = getRandom(0, positions.length - 1)
	// l'indice delle posizioni vicine a senderIndex entro la distanza "distance"
	// lo uso per nell' "expected"
	const indexNear = positions.reduce((acc, position, index) => {
		if (distancePoints(positions[senderIndex], position) <= distance) acc.push(index)
		return acc
	}, [] as number[])

	// l'indice delle posizioni che riceveranno il messaggio "we are close"
	const indexReceive: number[] = []

	await new Promise<void>(async (res, rej) => {

		// creo il CLIENT e mando la sua posizione
		const clients = await wsFarm(`ws://localhost:${PORT}/`, positions.length, (client, index) => {

			client.send(JSON.stringify({ path: "near", action: "position", payload: positions[index!] }))

			// se il CLIENT riceve "near" allora lo metto nell'array indexReceive
			client.on('message', message => {
				indexReceive.push(index!)
				// quando tutti i client "near" ricevono il messaggio allora concludi il Promise
				if (indexReceive.length == indexNear.length) {
					res()
				}
			})
		})

		// aspetto che tutte le posizioni siano mandate
		await wait(1000)

		// di un CLIENT-RANDOM manda un MESSAGE "radar" da consegnare a tutti i suoi "near"
		clients[senderIndex].send(JSON.stringify({ path: "near", action: "radar", payload: distance }))
	})

	indexNear.sort()
	indexReceive.sort()
	expect(indexNear).toEqual(indexReceive)
})

