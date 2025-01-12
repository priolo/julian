/**
 * @jest-environment node
 */

//import * as ws from "ws"
import { RootService } from "../../../core/RootService.js"
import SocketServerService, * as wsNs from "../index.js"
import { getFreePort, SocketRouteActions } from "../utils.js"

import ws from "ws"

import ywsUtils from 'y-websocket/bin/utils'
const Y = require('yjs');



let PORT: number = 5200
let root: RootService

beforeAll(async () => {
	//PORT = await getFreePort()
	root = await RootService.Start(
		<wsNs.SocketServerConf>{
			class: "ws",
			port: PORT,
			children: [
				<wsNs.SocketRouteConf>{
					class: "ws/route",

					// semplicemente s'e' connesso un nuovo client
					onConnect: function (client) {
						const cws = (<SocketServerService>this).findCWSByClient(client)
						console.log("ws/route onConnect")

						// ywsUtils.setupWSConnection(cws, req, {
						// 	//gc: req.url.slice(1) !== 'ws/prosemirror-versions' 
						// 	docName: "my-room"
						// })
						// const Y = require('yjs');
						// const ydoc = ywsUtils.getYDoc("my-room")
						// const yText = ydoc.get('shared-text', Y.Text);
						// yText.observe(event => {
						// 	const txt = yText.toString()
						// 	console.log("server::observe::", txt)
						// 	if ( txt == 'first' ) {
						// 		Y.transact(ydoc, () => {
						// 			yText.delete(0, yText.length);
						// 			yText.insert(0, 'second');
						// 		})
						// 	}
						// });
					},

					// il client manda un messaggio
					onMessage: async function (client, message) {
						console.log("ws/route onMessage")
						
					},

					// onMessage: async function (client, message) {
					// 	await this.dispatch({
					// 		type: SocketRouteActions.SEND,
					// 		payload: { client, message }
					// 	})
					// 	await this.dispatch({
					// 		type: SocketRouteActions.DISCONNECT,
					// 		payload: client
					// 	})
					// },
				}
			],
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})




test("test Y", async () => {

	const Y = await import('yjs');
	const ysck = await import('y-websocket')
	const ydoc = new Y.Doc()
	const wsProvider = new ysck.WebsocketProvider(
		`ws://localhost:${PORT}/`,
		'my-room',
		ydoc,
		{ WebSocketPolyfill: ws as any }
	)

	await new Promise<void>((res, rej) => {
		wsProvider.on("status", (evn) => {
			if (evn.status == "connected") {
				res()
			}
		})
	})

	const yText = ydoc.get('shared-text', Y.Text);

	let txt = ""
	await new Promise<void>((res, rej) => {
		yText.observe(event => {
			txt = yText.toString()
			console.log("client::observe::", txt)
			if ( txt == 'second' ) {
				res()
			}
		});

		Y.transact(ydoc, () => {
			yText.delete(0, yText.length);
			yText.insert(0, 'first');
		});
	})

	await new Promise((res) => setTimeout(res, 500))
	expect(txt).toBe('second')
})
