
import { LOG_TYPE, log } from "@priolo/jon-utils";
import { Request, Response, Router } from "express";
import { HttpRouterServiceBase } from "./HttpRouterServiceBase.js";
import { IHttpRouter } from "../http/utils.js";



export type HttpRouterServiceConf = Partial<HttpRouterService['stateDefault']> & { class: "http-router", children?: HttpRouterServiceConf[] }

/**
 * Generalmente figlio di un HttpServices
 * Mappa una richiesta HTTP REST con le funzioni della classe
 * Puo' essere annidato in altri RIUTERS per creare un albero di servizi REST
 */
export class HttpRouterService extends HttpRouterServiceBase {

	get stateDefault() {
		return {
			...super.stateDefault,
			/** nome del NODE di default */
			name: "router",
			/** se true gestisce gli errori */
			handleErrors: true,
			/** 
			 * lista di servizi REST per questo ROUTE 
			 **/
			routers: <IRouteParam[]>[]
		}
	}


	protected onBuildRouter(): Router {
		const router = super.onBuildRouter()

		// ciclo tutti i routers a disposizione e li inserisco nell'oggetto Router
		for (const route of this.state.routers) {

			// prelevo il metodo da chiamare sulle request
			let method: IRouteMethod = (typeof route == "function") ? route : (typeof route.method === "string") ? this[route.method] : route.method
			if (!method) { log(`impossibile creare il nodo`, LOG_TYPE.ERROR, route.path); return; }
			// prelevo il "verb"
			const verb = (route.verb ?? "get").toLocaleLowerCase()

			// creo il method
			const _method = method.bind(this)
			let methodThis = null
			if (this.state.handleErrors) {
				methodThis = async (req: Request, res: Response, next: any) => {
					try {
						await _method(req, res, next)
					} catch (e) {
						next(e)
					}
				}
			} else {
				methodThis = _method
			}

			// inserisco il router
			router[verb](route.path ?? "/", methodThis)
		}

		return router
	}

	/** [DA TESTARE] */
	protected async onDestroy(): Promise<void> {
		if (this.parent && 'use' in this.parent) {

			const routerDestroy = Router()
			for (const route of this.state.routers) {
				routerDestroy[route.verb ?? "get"](route.path ?? "/", (req, res, next) => {
					res.status(404).send("router not found")
				})
			}
			(this.parent as IHttpRouter).use(routerDestroy, this.state.path);
			
		}
		await super.onDestroy()
	}

}

/**
 * Definisce un ROUTER
 */
export type IRouteParam = {
	/** 
	 * path del ROUTER 
	 * */
	path?: string,
	/** 
	 * verbo HTTP 
	 * */
	verb?: string, //"get" | "post" | "update" | "delete",
	/** 
	 * metodo da chiamare quando invocato dal CLIENT
	 * */
	method: string | IRouteMethod,
}

/** 
 * funzione chiamata quando il ROUTER viene invocato dal CLIENT
 * */
type IRouteMethod = (req: Request, res: Response, next: any) => any
//type Verb = "get" | "post" | "update" | "delete"