

export enum Actions {
	/**
	 * PAYLOAD -> JWT-TOKEN  
	 * payload= `{ payload:json-like, options: https://github.com/auth0/node-jsonwebtoken#usage}`
	 */
	ENCODE = "encode",
	/**
	 * JWT-TOKEN -> PAYLOAD
	 * payload= `token: string`
	 */
	DECODE = "decode",
}