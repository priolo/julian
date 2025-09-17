import { getFreePort } from "../utils.js"
import { RootService } from "../../../core/RootService.js"
import { wsFarm } from "../../../test_utils.js"
import * as wsNs from "../index.js"


let PORT: number
let root: RootService

describe("invio a tutti i partecipanti", () => {

	/** Il SERVER quando riceve un messaggio da un CLIENT lo reinvia a tutti i CLIENTS registrati */
	beforeAll(async () => {
		PORT = await getFreePort()
		root = await RootService.Start(
			<wsNs.conf>{
				class: "ws",
				port: PORT,
				onLog: function (this: wsNs.Service, { name, payload }) {
					if (name !== wsNs.SocketLog.MESSAGE) return
					const { client, message }: { client: wsNs.IClient, message: string } = payload
					this.sendToAll(message)
				},
			}
		)
	})

	afterAll(async () => {
		await RootService.Stop(root)
	})

	test("send broadcast", async () => {

		const clientsLength = 5
		const clients = await wsFarm(`ws://localhost:${PORT}/`, clientsLength)

		const promises = clients.map(client => new Promise((res, rej) => {
			client.on('message', message => {
				client.close()
				res(message.toString())
			})
		}))

		clients[0].send("message")

		const ret = await Promise.all(promises)

		expect(ret).toEqual(Array.from({ length: clientsLength }, _ => "message"))
	})
})