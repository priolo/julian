
/**
 * Rappresenta un client connesso al server WEBSOCKET
 * le connessioni reali al websocket sono in un altro array
 * per dividere i dati del client da quelli del websocket
 */
export interface IClient {
	remoteAddress: string
	remotePort: number
	/** parametri ricavati dall'URL durante la connessione	*/
	params?: any
	/** PAYLOAD-JWT se è stato definito	*/
	jwtPayload?: any
}

/**
 * executablesMap di SocketServerService
 */
export enum SocketServerActions {
	/**
	 * Fa partire il server WEBSOCKET
	 * se `autostart` è `true` parte in automatico
	 */
	START = "ws:start",
	/**
	 * Ferma e libera le risorse del server WEBSOCKET
	 */
	STOP = "ws:stop"
}

/**
 * executablesMap di SocketRouteService
 */
export enum SocketRouteActions {
	/**
	 * Invia una STRINGA ad un CLIENT
	 * payload= `{ client:Client, message: JSON.stringify(obj) }`
	 */
	SEND = "ws:send",
	/**
	 * Invia un messaggio a tutti i client connessi
	 */
	BROADCAST = "ws:broadcast",
	/**
	 * Disconnette un CLIENT
	 * payload= `{ client:Client }`
	 */
	DISCONNECT = "ws:disconnect"
}

/**
 * LOG emessi dal server WEBSOCKET
 */
export enum SocketLog {
	/**
	 * un client si è connesso
	 */
	OPEN = "ws:open",
	/**
	 * un client si è disconnesso
	 */
	CLOSE = "ws:close",
	/**
	 * un client ha inviato un messaggio
	 */
	MESSAGE = "ws:message"
}
