import { Request } from "express"
import net from "net"
import url, { URLSearchParams } from 'url'
import { IClient } from "./types.js"



export function clientIsEqual(client: IClient, ws: IClient): boolean {
	return client.remoteAddress == ws.remoteAddress && client.remotePort == ws.remotePort
}

/**
 * Restituisce una porta random libera
 */
export async function getFreePort(): Promise<number> {
	return new Promise(res => {
		const srv = net.createServer();
		srv.listen(0, () => {
			const port = (<net.AddressInfo>srv.address()).port
			srv.close((err) => res(port))
		});
	})
}

/** 
 * restituisce i parametri QUERY-STRING presenti nella request 
 * */
export function getUrlParams(request: Request): any {
	const index = request.url.lastIndexOf("?")
	if ( index == -1 ) return {}
	const querystring = request.url.slice(index)
	const params = new URLSearchParams(querystring)
	return Object.fromEntries(params)
}
