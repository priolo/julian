import WebSocket from "ws"
import { PathFinder } from "../../../core/path/PathFinder.js"
import { RootService } from "../../../core/RootService.js"
import * as wsNs from "../index.js"
import { SocketServerConf } from "../SocketServerService.js"
import { time } from "@priolo/jon-utils"



let PORT: number = 52
let root: RootService

let ArrayApplicator: any
let ClientObjects: any
let ServerObjects: any

beforeAll(async () => {
  root = await RootService.Start(
    <SocketServerConf>{
      class: "ws",
      port: PORT,
    }
  )

  // Dynamically import the classes
  const jessModule = await import("@priolo/jess")
  ArrayApplicator = jessModule.ArrayApplicator
  ClientObjects = jessModule.ClientObjects
  ServerObjects = jessModule.ServerObjects
})

afterAll(async () => {
  await RootService.Stop(root)
})

test("su creazione", async () => {
  const wss = new PathFinder(root).getNode<wsNs.Service>("/ws-server")
  expect(wss).toBeInstanceOf(wsNs.Service)
})

test("client connetc/send/close", async () => {
  const myServer = new ServerObjects()
  const wss: wsNs.Service = PathFinder.Get(root, "/ws-server")
  wss.emitter.on("message", ({ client, message }) => myServer.receive(message, client))
  myServer.apply = ArrayApplicator.ApplyAction
  myServer.onSend = async (client, message) => wss.sendToClient(client, message)

  const myClient = new ClientObjects()
  const wsc = new WebSocket(`ws://localhost:${PORT}/`)
  myClient.apply = ArrayApplicator.ApplyAction
  myClient.onSend = async (message) => wsc.send(JSON.stringify(message))
  await new Promise<void>(res => {
    wsc.on('open', () => res())
    wsc.on('message', (data) => myClient.receive(data.toString()))
  })

  // osservo un oggetto
  await myClient.init("pippo")
  // creo due comandi
  myClient.command("pippo", {
    "type": "insert_text",
    "path": [0, 0], "offset": 0,
    "text": "pluto"
  })
  myClient.command("pippo", {
    "type": "remove_text",
    "path": [0, 0], "offset": 2,
    "text": "ut"
  })
  // invio i comandi al SERVER
  myClient.update()
  // attendo che il websocket invii i comandi al SERVER
  await time.delay(200)

  // il server ha ricevuto i COMMANDs e quindi li distribuisce
  myServer.update()
  // attendo che il websocket invii i comandi al CLIENT
  await time.delay(200)

  expect(myServer.objects["pippo"].value).toEqual([
    { children: [{ text: "plo", }] },
  ])
  expect(myClient.objects["pippo"].value).toEqual([
    { children: [{ text: "plo", }] },
  ])

})
