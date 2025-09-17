import { CookieOptions, Request, Response } from "express"



/**
 * le ACTIONS che possono essere invitate al SERVICE JWT
 */
export enum RouteJWTUserActions {
    /** genera e restituisce un TOKEN(:string) in base al PAYLOAD(:json) */
    GENERATE_TOKEN = "generate_token",
}

/** Genera una STRATEGY di tipo COOKIE per la gestione del JWT */
export function CookieStrategyFarm(options:CookieOptions, name:string = "jwt"):JWTStrategy {
    return {
        getToken: (req: Request) => {
            return req.cookies[name]
        },
        putToken: ( token:string, res:Response) => {
            res.cookie(name, token, options)
        },
    }
}

/** STRATEGY di default per la gestione COOKIES del JWT */
export const CookieStrategy:JWTStrategy = CookieStrategyFarm({ 
    maxAge: 900000, 
    httpOnly: true,
    //domain: "localhost:8080"
})

/** STRATEGY per la gestione HEAD del JWT */
export const HeaderStrategy:JWTStrategy = {
    getToken: (req: Request) => {
        let token = req.headers["authorization"]?.slice(7)
        return token && token.length > 0 ? token : null
    },
    putToken: ( token:string, res:Response) => {
    },
}

export interface JWTStrategy {
    getToken (req:Request)
    putToken ( token:string, res:Response )
}