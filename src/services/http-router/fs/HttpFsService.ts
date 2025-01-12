import express, { Request, Response, Router } from "express"
import { HttpRouterServiceBase } from "../HttpRouterServiceBase.js"



/**
 * DA COMPLETARE
 * Espone delle API
 * adatte alle operazioni su File System
 */
export class HttpFsService extends HttpRouterServiceBase {

    get stateDefault(): any {
        return {
            ...super.stateDefault,
            name: "route-fs",
            /** path-fs:request */
            fs: "", 
            /** directory base */
            baseDir: "/", 
        }
    }

    protected onBuildRouter(): Router {
        const router = super.onBuildRouter()
        const { path } = this.state

        // prelevo i dati della directory
        router.get(path, (req: Request, res: Response, next) => {
            const {dir} = req.params
        })


        return router
    }
}