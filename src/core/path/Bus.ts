import { log, LOG_TYPE, time } from "@priolo/jon-utils";
import { INode } from "../node/INode.js";
import { NodeState } from "../node/NodeState.js";
import { IAction } from "../types.js";
import { nodePath } from "../utils.js";



/**
 * Permette di consegnare un ACTION ad un NODE
 * tramite il suo PATH
 * e quindi chiama "execute"
 */
export class Bus {
	constructor(sender: INode, path: string) {
		this.sender = sender
		this.path = path
	}

	private sender: INode = null
	private path: string = null
	private bufferWait: IAction[] = []

	/**
	 * Consegna un ACTION al suo destinatario partendo dal nodo "this.sender"
	 * @param action 
	 */
	async dispatch<T=any>(action: IAction | string): Promise<T> {
		
		if (!action) throw "errore parametro action"
		if (typeof action == "string") action = { type: action } as IAction
		const dest:NodeState = this.sender.nodeByPath(this.path)
		let res = null

		if (!action.sender) action.sender = nodePath(this.sender)
		action.sendTime = Date.now()

		if (dest) {
			res = this.tryDispatch(dest, action, action.error?.reattempt)

			// se il nodeo destinazione non c'e'
			// ed è presente l'opzione [await:millisec] 
			// il messaggio viene bufferizzato e riproposto fino a che non scade il tempo massimo wait
		} else {
			log(`bus:path:[${this.path}]:not_found`, LOG_TYPE.ERROR)
			if (!action.wait || action.wait == 0) return
			this.bufferWait.push(action)
		}

		this.bufferWaitDebounce()
		return res
	}

	/**
	 * Prova a eseguire l'ACTION
	 * se c'e' una gestione dell ERRORE con reattempt riprova il numero di volte specificato
	 */
	private async tryDispatch(dest: NodeState, action: IAction, attempt: number = 0): Promise<any> {
		try {
			return await dest.execute(action)
		} catch (err) {
			if (action?.error && attempt > 0) {
				await new Promise(resolve => setTimeout(resolve, action.error.wait))
				return await this.tryDispatch(dest, action, --attempt)
			} else {
				throw err
			}
		}
	}


	//#region BUFFER

	/**
	 * Cerca di risolvere tutte le ACTION presenti nel buffer
	 * [II] ERRORE!!! se ci sono molte actions il debounce non si attiverà e fara' passare il tempo dopo il quale la action viene distrutta
	 */
	private bufferWaitResolve(): void {
		if (this.bufferWait.length == 0) return
		const now = Date.now()
		const actions = [...this.bufferWait]
		for (const action of actions) {
			const delta = now - action.sendTime
			const index = this.bufferWait.indexOf(action)
			this.bufferWait.splice(index, 1)
			if (delta < action.wait) {
				this.dispatch(action)
			}
		}
	}

	/**
	 * Aspetta un po' di tempo e poi effettua la soluzione del buffer
	 * non lo faccio subito altrimenti poi le performance che dicono he?
	 */
	private bufferWaitDebounce(): void {
		if (this.bufferWait.length == 0) return
		time.debounce("bus:buffer:wait", this.bufferWaitResolve.bind(this), 500)
	}

	//#endregion
}