import { Request } from "express"
import { createServer, Server } from 'http'
import url from 'url'
import { WebSocket, WebSocketServer } from "ws"
import { Bus } from "../../core/path/Bus.js"
import { TypeLog } from "../../core/types.js"
import * as http from "../http/index.js"
import * as jwtNs from "../jwt/index.js"
import { SocketCommunicator } from "./SocketCommunicator.js"
import { SocketRouteConf, SocketRouteService } from "./SocketRouteService.js"
import { IClient, SocketServerActions } from "./types.js"
import { clientIsEqual, getUrlParams } from "./utils.js"



export type SocketServerConf = Partial<SocketServerService['stateDefault']>
	& { class: "ws" | `npm:${string}` | (new (...args: any[]) => SocketRouteService), children?: SocketRouteConf[] }

export type SocketServerAct = SocketServerService['executablesMap']

export class SocketServerService extends SocketCommunicator {

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "ws-server",
			autostart: true,
			port: <number>null,
			/** path dove sta il cod/dec jwt */
			jwt: <string>null,
			/** Nome del cookie da cui estrarre il token JWT (default: "jwt") */
			cookieName: "jwt",
			/** i CLIENTS presenti */
			clients: <IClient[]>[],
			/** se implementata blocca la connessione su controllo JWT */
			onAuth: <(jwtPayload: string) => boolean>null,
			/** path su cui ascoltare le connessioni */
			path: <string>null,
		}
	}

	get executablesMap() {
		return {
			...super.executablesMap,
			[SocketServerActions.START]: async () => await this.startListener(),
			[SocketServerActions.STOP]: async () => await this.stopListener(),
		}
	}

	/**
	 * Semplicemente il server WEB-SOCKET
	 */
	private server: WebSocketServer = null
	private httpServer: Server = null
	private wsToClient = new WeakMap<WebSocket, IClient>()

	protected async onInit() {
		await super.onInit()
		if (!this.state.autostart) return
		await this.startListener()
	}

	protected async onDestroy() {
		super.onDestroy()
		await this.stopListener()
	}


	//#region FARM

	/**
	 * Inizializza il server in base a come è impostato il config.
	 * (insomma tutte le cose pallose)
	 */
	private async startListener() {
		if (this.server) return
		const { port } = this.state
		if (port) {
			await this.buildServer()
			this.log(`SocketServerService:start:url:[http://localhost:${this.state.port}]`, null, TypeLog.INFO)
		} else {
			this.attachToServerHttp()
		}
		this.buildEventsServer()
	}

	/**
	 * Costruisce un SERVER-WEB-SOCKET senza bisogno di un SERVER-HTTP 
	 */
	private async buildServer(): Promise<void> {
		return new Promise((res, rej) => {
			if (!this.state.port) rej("no port")
			this.httpServer = createServer()
			this.server = new WebSocketServer({ noServer: true })
			this.httpServer.on('upgrade', this.onUpgrade)
			this.httpServer.listen(this.state.port, () => res())
		})
	}

	/**
	 * Attacca il SERVER-WEB-SOCKET al SERVER-HTTP superiore
	 */
	private attachToServerHttp() {
		this.httpServer = this.parent instanceof http.Service ? (<http.Service>this.parent).server : null
		if (!this.httpServer) throw new Error("non c'e' il server http")
		this.server = new WebSocketServer({ noServer: true })
		this.httpServer.on('upgrade', this.onUpgrade)
	}

	/**
	 * Stacca il SERVER-WEB-SOCKET dal SERVER-HTTP superiore
	 */
	private detachToServerHttp() {
		const parentHttp = this.parent instanceof http.Service ? (<http.Service>this.parent).server : null
		if (!parentHttp) return
		parentHttp.off('upgrade', this.onUpgrade)
	}

	/**
	 * Gestisce la richiesta di upgrade a WebSocket
	 */
	private onUpgrade = async (request, socket, head) => {
		let { path } = this.state
		const params = getUrlParams(request)

		// controllo che il path sia giusto
		const wsUrl = url.parse(request.url)
		if (!path) path = ""
		if (!path.startsWith("/")) path = `/${path}`
		if (wsUrl.pathname != path) {
			if (this.state.port) socket.destroy()
			return
		}

		// controllo se c'e' un autentificazione da fare
		let jwtPayload: any = null
		if (this.state.jwt) {
			const token = this.getTokenFromRequest(request, params)
			jwtPayload = await this.getJwtPayload(token)
			const response = this.state.onAuth ? this.state.onAuth.bind(this)(jwtPayload) : true
			if (!response) {
				socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
				socket.destroy()
				return
			}
		}

		// gestisce la connessione col client	
		// a qaunto pare non è possibile leggere l'header
		// https://stackoverflow.com/a/4361358/5224029		
		this.server.handleUpgrade(request, socket, head, (ws) => {
			this.server.emit('connection', ws, request, jwtPayload)
		})
	}

	/**
	 * Estrae il token dalla richiesta (query param, header Authorization, cookie)
	 */
	private getTokenFromRequest(request: any, params: any): string {
		let token = params.token
		if (!token && request.headers['authorization']) {
			const parts = request.headers['authorization'].split(' ')
			if (parts.length == 2 && parts[0] == 'Bearer') {
				token = parts[1]
			}
		}
		if (!token && this.state.cookieName && request.headers.cookie) {
			const cookies = request.headers.cookie.split(';').reduce((acc, cookie) => {
				const [name, value] = cookie.trim().split('=')
				if (name && value) acc[name] = value
				return acc
			}, {} as Record<string, string>)
			token = cookies[this.state.cookieName]
		}
		return token
	}

	/**
	 * Ricavo il JWT-PAYLOAD 
	 */
	private async getJwtPayload(token: string) {
		const { jwt } = this.state
		if (!token) return null
		const payload = await new Bus(this, jwt).dispatch({
			type: jwtNs.Actions.DECODE,
			payload: token
		})
		return payload
	}

	/** Fine della storia */
	private async stopListener() {
		if (!this.server) return
		return new Promise<void>((res, rej) => {
			this.server.close((err) => {
				if (this.state.port && this.httpServer) {
					this.httpServer.close(() => {
						this.httpServer = null
						if (err) rej(err); else res()
					})
				} else {
					if (err) rej(err); else res()
				}
			})
			this.detachToServerHttp()
			this.server = null
			if (!this.state.port) this.httpServer = null
		})
	}

	/**
	 * Si mette in ascolto sugli eventi del SERVER-WEB-SOCKET
	 */
	private buildEventsServer() {

		// when a CLIENT conect
		this.server.on('connection', (cws: WebSocket, req: Request, jwtPayload: any) => {
			const client: IClient = {
				remoteAddress: req.socket.remoteAddress,
				remotePort: req.socket.remotePort,
				params: getUrlParams(req),
				jwtPayload
			}
			cws.binaryType = "nodebuffer"

			this.wsToClient.set(cws, client)
			this.buildEventsClient(cws)
			this.addClient(client)
			this.onConnect(client)
		})

		this.server.on("error", (error) => { console.log("server:error:", error) })
		//this.server.on("close", (cws: WebSocket) => { console.log("server:close:"); /*debugger*/ })
	}

	/**
	 * Si mette in ascolto sugli eventi del CLIENT-WEB-SOCKET arrivato al server
	 */
	private buildEventsClient(cws: WebSocket) {

		cws.on('message', async (message: string) => {
			// const msg: string = typeof message === 'string' 
			// 	? message 
			// 	: Buffer.from(message).toString()
			const client = this.findClientByCWS(cws)
			try {
				await this.onMessage(client, message)
			} catch (error) {
				this.log("ws:onMessage", error, TypeLog.ERROR)
			}
		})

		cws.on('error', (error) => { this.log("ws:client:error", error, TypeLog.ERROR) })

		cws.on('close', (code: number, reason: string) => {
			const client = this.findClientByCWS(cws)
			this.removeClient(client)//this.updateClients()
			this.onDisconnect(client)
		})

	}

	//#endregion


	//#region ROOM

	getClients(): IClient[] {
		return this.state.clients
	}

	/**
	 * Restituisce un CLIENT-WEB-SOCKET tramite CLIENT-JSON
	 */
	private findCWSByClient(client: IClient) {
		const wsClients = this.server.clients as Set<any>
		for (const wsClient of wsClients) {
			if (clientIsEqual(wsClient._socket, client)) {
				return wsClient
			}
		}
		return null
	}

	/**
	 * Restituisce un CLIENT-JSON tramite CLIENT-WEB-SOCKET
	 */
	private findClientByCWS(cws: WebSocket) {
		return this.wsToClient.get(cws)
	}

	/**
	 * aggiunge una connessione CLIENT
	 */
	private addClient(client: IClient) {
		const { clients } = this.state
		clients.push(client)
		this.setState({ clients })
	}

	/**
	 * rimuove una connessione CLIENT
	 */
	private removeClient(client: IClient) {
		const clientsnew = this.state.clients.filter(c => !clientIsEqual(client, c))
		this.setState({ clients: clientsnew })
	}

	//#endregion


	//#region COMMUNICATOR 

	/**
	 * Invio il message al client websocket 
	 */
	private sendToCWS(cws: WebSocket, message: any): boolean {
		if (cws.readyState != WebSocket.OPEN) return false
		try {
			cws.send(message)
		} catch (error) {
			this.log("ws:sendToCWS", error, TypeLog.ERROR)
			return false
		}
		return true
	}

	/**
	 * Invia un MESSAGE al CLIENT
	 * @param client il client che riceve il messaggio
	 * @param message messaggio da mandare
	 */
	sendToClient(client: IClient, message: any) {
		const cws: WebSocket = this.findCWSByClient(client)
		this.sendToCWS(cws, message)
	}

	/**
	 * Invia a tutti i client connessi
	 * @param message messaggio da inviare
	 */
	sendToAll(message: any) {
		this.server.clients.forEach(cws => {
			this.sendToCWS(cws as any, message)
		})
	}

	async sendPing(client: IClient, timeout: number): Promise<number> {
		const cws: WebSocket = this.findCWSByClient(client)
		if (!cws) return
		return new Promise<number>((res, rej) => {
			const startTime = Date.now()

			const onPong = () => {
				clearTimeout(idTimer)
				const deltaTime = Date.now() - startTime
				res(deltaTime)
			}

			const idTimer = setTimeout(() => {
				cws.off("ping", onPong)
				clearTimeout(idTimer)
				res(timeout)
			}, timeout)

			cws.once("pong", onPong)
			cws.ping()
		})
	}

	disconnectClient(client: IClient) {
		const cws: WebSocket = this.findCWSByClient(client)
		cws.close()
	}

	//#endregion

}