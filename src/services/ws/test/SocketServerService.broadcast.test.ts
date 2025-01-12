import { getFreePort } from "../utils.js"
import { RootService } from "../../../core/RootService.js"
import { wsFarm } from "../../../test_utils.js"


let PORT: number
let root: RootService


/** Il SERVER quando riceve un messaggio da un CLIENT lo reinvia a tutti i CLIENTS registrati */
beforeAll(async () => {
	PORT = await getFreePort()
	root = await RootService.Start(
		{
			class: "ws",
			port: PORT,
			onMessage: async function (client, message) {
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
			res(message)
		})
	}))

	clients[0].send("message")

	const ret = await Promise.all(promises)

	expect(ret).toEqual(Array.from({ length: clientsLength }, _ => "message"))
})