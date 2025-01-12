import { Request, Response } from "express";
import { HttpRouterService, HttpRouterServiceConf, IRouteParam } from "../HttpRouterService.js";


//export type HttpRouterRestServiceBaseConf = Partial<HttpRouterRestServiceBase['stateDefault']>

/**
 * [ABSTRACT] DA IMPLEMENTARE
 * mappa i metodi REST 
 */
export abstract class HttpRouterRestServiceBase extends HttpRouterService {

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "route-rest",
			routers: <IRouteParam[]>[
				{ path: "/", verb: "get", method: "_getAll" },
				{ path: "/:id", verb: "get", method: "_getById" },
				{ path: "/", verb: "post", method: "_save" },
				{ path: "/:id", verb: "delete", method: "_delete" },
			]
		}
	}

	protected async _getAll(req: Request, res: Response): Promise<void> {
		res.json(await this.getAll())
	}
	protected abstract getAll(): Promise<any[]>

	protected async _getById(req: Request, res: Response): Promise<void> {
		const id = req.params["id"]
		res.json(await this.getById(id))
	}
	protected abstract getById(id: string): Promise<any>

	protected async _save(req: Request, res: Response): Promise<void> {
		const entity = req.body
		res.json(await this.save(entity))
	}
	protected abstract save(entity: any): Promise<any>

	protected async _delete(req: Request, res: Response, next): Promise<void> {
		const id = req.params["id"]
		res.json(await this.delete(id))
	}
	protected abstract delete(id: string): Promise<any>
}