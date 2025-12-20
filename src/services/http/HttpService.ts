
import cookieParser from 'cookie-parser'
import express, { Express, NextFunction, Request, Response, Router } from "express"
import { engine as exphbs } from 'express-handlebars'
import fs from "fs"
import http, { Server } from "http"
import https, { ServerOptions } from "https"
import { ServiceBase } from "../../core/ServiceBase.js"
import { TypeLog } from "../../core/types.js"
import { HttpRouterServiceConf } from "../http-router/HttpRouterService.js"
import { SocketServerConf } from "../ws/SocketServerService.js"
import { IHttpRouter } from "./types.js"



export type HttpServiceConf = Partial<HttpService['stateDefault']>
	& { class: "http", children?: Array<HttpRouterServiceConf | SocketServerConf> }
//export type HttpServiceAct = HttpService['dispatchMap']

type LoggingOptions = boolean & { body?: boolean; headers?: boolean };

/**
 * Praticamente mantiene un instanza di un server "express"
 * raccoglie il meglio del meglio di EXPRESS!!!
 */
export class HttpService extends ServiceBase implements IHttpRouter {

	//#region SERVICE

	private app: Express | null = null
	private _server: Server | null = null
	get server(): Server {
		return this._server
	}

	get stateDefault() {
		return {
			...super.stateDefault,
			/** nome del NODE di default */
			name: "http",
			/**  la porta su cui il server rimane in scolto */
			port: 5000,
			/** il render da utilizzare per il momento c'e' solo "handlebars"  */
			render: <any>null,
			/** 
			 * opzioni di express:  
			 * @link https://expressjs.com/en/4x/api.html#app.set
			 */
			options:<{ [key: string]: any }>null,
			/** 
			 * se valorizzato creo un server `https`
				@example
				https: {
					// file del certificato pubblico
					privkey: "privkey.pem",
					// file della chiave privata
					pubcert: "pubcert.pem",
				}
				@link https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener
			*/
			https: <ServerOptionsCustom>null,
			/**
			 * paths (con eventuali WILDCARDS) gestite come RAW-BODY e non come JSON
			 */
			rawPaths: <string[]>[],
			/**
			 * inserisce middleware per i log
			 * false: nessun log
			 * true: tutti i log
			 * object: log selettivo
			 * { method, body, header }
			 */
			log: <LoggingOptions>false,
		}
	}
	declare state: typeof this.stateDefault

	/**
	 * Creo l'instanza del server EXPRESS collegandola ai plugin
	 */
	protected async onInit(): Promise<void> {
		await super.onInit()

		this.app = express()
		this.buildProperties()

		// path da gestire con il raw-body e non JSON le inserisco prima di tutto
		this.state.rawPaths.forEach(p => this.app.all(p, express.raw({ type: 'application/json' })))
		// middleware per contenuti json
		this.app.use(express.json())
		this.app.use(express.urlencoded({ extended: true }))
		this.app.use(cookieParser())
		const loggerMw = this.createHttpLogger();
		if (loggerMw) this.app.use(loggerMw);

		this.buildRender()
		this._server = this.buildServer()
		await this.listenServer()
	}

	/**
	 * Alla fine di tutto metto il gestore degli errori
	 */
	protected async onInitAfter() {
		await super.onInitAfter()
		// il gestore degli errori va inserito per ultimo
		this.app.use((err: Error, req: Request, res: Response, next) => {
			// se c'e' un gestore di errore come figlio inoltra l'errore pure li
			this.log(`HttpService:error`, err, TypeLog.ERROR)
			res.status(500).json({ error: err?.message ?? "Internal Server Error" });
			// continua il discorso...
			//next(err)
		})
	}

	/**
	 * Sulla distruzione del nodo fermo il server
	 */
	protected async onDestroy(): Promise<void> {
		return new Promise<void>((res, rej) => {
			this._server.close((err) => {
				this.log(`HttpService:stop`, null, TypeLog.INFO)
				this._server = null
				res()
			})
			setImmediate(() => {
				this._server?.emit('close')
				//res()
			})
		})
	}

	//#endregion


	/**
	 * Questa funzione è utilizzata dai CHILD quando devono agganciarsi a questo servizio PARENT
	 */
	use(router: Router, path: string = "/"): void {
		this.app.use(path, router)
	}

	/**
	 * Costruisce il server EXPRESS
	 */
	private buildServer(): Server {
		const { https: httpsConf } = this.state as HttpServiceConf
		let server: Server = null
		// è un https
		if (httpsConf) {
			if (httpsConf.privkey) {
				httpsConf.key = fs.readFileSync(httpsConf.privkey)
				delete httpsConf.privkey
			}
			if (httpsConf.pubcert) {
				httpsConf.cert = fs.readFileSync(httpsConf.pubcert)
				delete httpsConf.pubcert
			}
			server = https.createServer(httpsConf, this.app)
			// è un http sempliciotto
		} else {
			server = http
				.createServer(this.app)
		}

		return server
	}

	/**
	 * Mette in ascolto il server EXPRESS
	 */
	private async listenServer(): Promise<http.Server> {
		return new Promise<http.Server>((res, rej) => {
			const listener = this._server.listen(
				this.state.port,
				() => {
					this.log(`HttpService:start:url:[http://localhost:${this.state.port}]`, null, TypeLog.INFO)
					res(listener)
				}
			)
		})
	}

	/**
	 * Setta l'engine handlebars
	 */
	private buildRender(): void {
		if (!this.state.render) return

		// https://github.com/express-handlebars/express-handlebars#api
		const options = this.state.render.options ?? { extname: ".hbs" }
		const engine = exphbs(options)

		this.app.engine(options.extname, engine)
		this.app.set('view engine', options.extname);
	}

	/**
	 * https://expressjs.com/en/4x/api.html#app.set
	 */
	private buildProperties(): void {
		if (!this.state.options) return
		Object.entries(this.state.options).forEach(([key, value]) => this.app.set(key, value))
	}

	private createHttpLogger(): express.RequestHandler | null {
		if (!this.state.log) return null

		return (req: Request, res: Response, next: NextFunction) => {
			const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip
			let logData: any = { ip }
			if (this.state.log === true || this.state.log?.body === true) logData.body = req.body
			if (this.state.log === true || this.state.log?.headers === true) logData.headers = req.headers;
			this.log(
				`HTTP ${req.method} ${req.originalUrl}`,
				logData,
				TypeLog.INFO
			)
			next()
		}
	}
}

type ServerOptionsCustom = ServerOptions & { privkey: string, pubcert: string }