import WebSocket from "ws"


export function distancePoints(p1, p2) {
	if (!p1.x || !p1.y || !p2.x || !p2.y) throw new Error("invalid parameter")
	const res = Math.sqrt(Math.pow(p1.x - p2.x, 2) + (Math.pow(p1.y - p2.y, 2)))
	if (isNaN(res)) throw new Error("invalid parameter")
	return res
}

export function getRandom(min, max) {
	return Math.round(Math.random() * (max - min) + min)
}

/**
 * Permette di creare un array di websocket
 * @param address 
 * @param length 
 * @param onConnection 
 * @returns 
 */
export async function wsFarm(
	address: ((index?: number) => string) | string,
	length: number,
	onConnection?: (client: WebSocket, index?: number) => void
): Promise<WebSocket[]> {
	return new Promise<WebSocket[]>((res, rej) => {
		let count = 0
		const clients = Array.from<any, WebSocket>({ length }, (_, index) => {
			const strAddress = (typeof address == "function") ? address(index) : address
			const ws = new WebSocket(strAddress)
			ws.once('open', () => {
				onConnection?.(ws, index)
				count++
				if (count == length) res(clients)
			})
			return ws
		})
	})
}