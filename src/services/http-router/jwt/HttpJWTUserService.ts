import { Request, Response, Router } from "express"
import { Bus } from "../../../core/path/Bus.js"
import * as jwtNs from "../../jwt/index.js"
import { HttpRouterServiceBase, HttpRouterServiceBaseConf } from "../HttpRouterServiceBase.js"
import { CookieStrategy, RouteJWTUserActions } from "./utils.js"



export type HttpJWTUserServiceConf = Partial<HttpJWTUserService['stateDefault']> & { class: "http-router/jwt", children?: HttpRouterServiceBaseConf[] }

/**
 * middleware 
 * permette di creare l'USER tramite TOKEN
 */
export class HttpJWTUserService extends HttpRouterServiceBase {

    get stateDefault() {
        return {
            ...super.stateDefault,
            name: "route-jwt",
            /** 
             * è il NOME della proprietà che il SERVICE JWT inserisce 
             * nella "Request" express che contiene il PAYLOAD
             */
            payloadPropertyName: "jwtPayload",
            /** 
             * la path del jwt che si occupa di codificare/decodificare
             */
            jwt: "",                    // path-jwt:request
            /**
             * Strategia da utilizzare per inserire/estrarre il token
             */
            strategy: CookieStrategy,   // strategia da attuare per il login
            /**
             * 
             */
            disabled: false,
        }
    }

    get executablesMap() {
        return {
            ...super.executablesMap,
            [RouteJWTUserActions.GENERATE_TOKEN]: (payload: any) => this.generateToken(payload),
        }
    }


    protected onBuildRouter(): Router {
        const router = super.onBuildRouter()

        router.use(async (req: Request, res: Response, next) => {
            const { jwt, strategy } = this.state

            // se è disabilitato non fa nulla
            if ( this.state.disabled ) return next()

            // prelevo il token in base alla strategia scelta
            const token = await strategy.getToken(req)

            // se non c'e' il token emetto un errore
            if (!token) return res.sendStatus(401)

            // decodifico il jwt
            const payload = await new Bus(this, jwt)
                .dispatch({ type: jwtNs.Actions.DECODE, payload: token })
            // se non sono riusito a decodificarlo ... errore!
            if (!payload) return res.sendStatus(401)

            // inserisco il payload nel messaggio request e continuo nei router express
            req[this.state.payloadPropertyName] = payload
            next()
        })

        return router
    }

    /**
     * Genera il TOKEN JWT in base al payload passato come parametro
     * @param payload 
     * @returns 
     */
    protected async generateToken(payload: any): Promise<string> {
        return new Bus(this, this.state.jwt).dispatch({
            type: jwtNs.Actions.ENCODE,
            payload: { payload, options: { expiresIn: "1h" } },
        })
    }

    /** 
     * genero un TOKEN tramite payload 
     * e lo inserisco nella "strategy" (header o cookies)
     */
    public async putPayload(payload: any, res: Response): Promise<string> {
        const token = await this.generateToken(payload)
        this.state.strategy.putToken(token, res)
        return token
    }

}
