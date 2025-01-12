import { TypeormStore } from "connect-typeorm"
import { Router } from "express"
import session from 'express-session'
import { TypeormService } from "../../typeorm/TypeormService.js"
import { HttpRouterServiceBase } from "../HttpRouterServiceBase.js"
import { SessionEntity } from "./SessionEntity.js"



/**
 * middleware 
 * gestisce una session
 */
export class HttpSessionService extends HttpRouterServiceBase {

    get stateDefault(): any {
        return {
            ...super.stateDefault,
            name: "route-session",  // string
            // https://github.com/expressjs/session#options
            options: {
                secret: "a secret string",
                resave: false,
                saveUninitialized: false,
                cookie: { maxAge: 60000 }
            },
            typeorm: null,
        }
    }

    private store:any = null

    protected async onInitFinish(): Promise<void> {
        const { typeorm, options } = this.state 

        if ( typeorm ) {
            const nodeTypeorm = this.nodeByPath<TypeormService>(typeorm)
            const connection = nodeTypeorm.connection
            const repository = connection.getRepository(SessionEntity)
            options.store = new TypeormStore({
                cleanupLimit: 2,
                limitSubquery: false, // If using MariaDB.
                ttl: 86400
            }).connect(repository)
        }
        
        this.store = session(options)
    }

    protected onBuildRouter(): Router {
        const router = super.onBuildRouter()
        const { options, typeorm } = this.state
 
        router.use(async (req,res,next)=>{
            if ( this.store ) {
                this.store(req,res,next)
                return
            }
            next()
        })

        return router
    }
}