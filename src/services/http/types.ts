import { Router } from "express";



export interface IHttpRouter {
	use(router: Router, path?: string): void
}

/**
 * Gli errori che puo' emettere questo servizio
 */
export enum Errors {
	HANDLE = "http:handle"
}