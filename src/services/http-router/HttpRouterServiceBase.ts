import cors from "cors";
import express, { Router } from "express";
import { ServiceBase } from "../../index.js";
import { IHttpRouter } from "../http/utils.js";



export type HttpRouterServiceBaseConf = Partial<HttpRouterServiceBase['stateDefault']>

/**
 * Si attacca al PARENT (deve implementare IHttpRouter) come ROUTER
 */
export abstract class HttpRouterServiceBase extends ServiceBase implements IHttpRouter {

	private router: Router = null

	get stateDefault() {
		return {
			...super.stateDefault,
			headers: <{ [key: string]: string }>null,
			cors: <any>null,
			path: "/",
		}
	}

	protected async onInit(): Promise<void> {
		await super.onInit()
		//const parent = new PathFinder(this).getNode<IHttpRouter>("..")
		if (!this.parent || !('use' in this.parent)) return
		this.router = this.onBuildRouter();
		(this.parent as IHttpRouter).use(this.router, this.state.path);
	}

	protected async onDestroy(): Promise<void> {
		await super.onDestroy()
		this.router = null
	}

	/** 
	 * costruisco il ROUTE che poi sarà applicato (use) aplicato ROUTE parent su "onInit" 
	 **/
	protected onBuildRouter(): Router {
		const router = express.Router()

		// se c'e' un vincolo di "accept" allora lo utilizzo
		if (this.state.headers) {
			router.use((req, res, next) => {
				const chkHeaders = Object.keys(req.headers).some(k => {
					const value = this.state.headers[k.toLocaleLowerCase()]
					return (req.headers[k] as string).toLowerCase().indexOf(value) != -1
				})
				next(!chkHeaders ? "router" : undefined)
			})
		}

		// se c'e' un "cors options" lo applico
		if (this.state.cors) {
			router.use(cors(this.state.cors))
		}

		return router
	}

	use(router: Router, path: string = "/"): void {
		this.router.use(path, router)
	}

}
