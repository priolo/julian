import jwt from "jsonwebtoken";
import { ServiceBase } from "../../core/ServiceBase.js";
import { Actions } from "./utils.js";



export type JWTServiceConf = Partial<JWTRepoService['stateDefault']> & { class: "jwt" }

export class JWTRepoService extends ServiceBase {

	get stateDefault(): any {
		return {
			...super.stateDefault,
			name: "jwt",
			secret: "secret_word"
		}
	}

	get executablesMap(): any {
		return {
			...super.executablesMap,
			[Actions.ENCODE]: ({ payload, options }) => this.encode(payload, options),
			[Actions.DECODE]: async (payload: string) => this.decode(payload),
		}
	}

	/**
	 * Codifica un PAYLOAD con delle opzioni in un JWT-TOKEN
	 * @param payload tipicamente un oggetto json-like
	 * @param options https://github.com/auth0/node-jsonwebtoken#usage
	 * vedere anche: https://tools.ietf.org/html/rfc7519
	 * @returns 
	 */
	private encode(payload: string | object | Buffer, options: jwt.SignOptions): string {
		return jwt.sign(payload, this.state.secret, options)
	}

	/**
	 * Decodifica un JWT-TOKEN in un oggetto originale
	 * @param token 
	 * @returns 
	 */
	private decode(token: string): string {
		const { secret } = this.state
		try {
			return jwt.verify(token, secret) as string
		} catch (e) {
			return null
		}
	}

}