import { nodePath } from "../utils.js";
import { INode } from "./INode.js";
import { Node } from "./Node.js";
import { NamesLog, IAction, ILog, TypeLog, NamesAction } from "../types.js";



export type NodeStateConf = Partial<NodeState['stateDefault']>

/**
 * - Classe responsabile di mantenere uno STATE
 * - cambiare e notificare lo STATE
 * - eseguire un ACTION
 */
export abstract class NodeState extends Node {

	constructor(name?: string, state = {}) {
		super(name)
		this._state = {
			...this.stateDefault,
			...state
		}
		if (!name && this.state.name?.length > 0) {
			this.name = this.state.name
		}
	}

	//#region STATE

	/**
	 * insieme allo STATO DI ISTANZA del NODE (con il quale viene mergiato)
	 * determina il valore iniziale dello STATE
	 */
	get stateDefault() {
		return {
			/** se c'e' è nome da dare al nodo */
			name: <string>null,
			/** se c'e' viene chiamata su quauque log emesso */
			onLog: <(this: NodeState, log: ILog) => void>null,
		}
	}

	/**
	 * Stato attuale del nodo
	 */
	get state(): this['stateDefault'] & { [key: string]: any } {
		return this._state
	}
	protected _state!: this['stateDefault'] & { [key: string]: any }

	/**
	 * Modifica lo stato
	 * si tratta sempre di un MERGE con lo stato precedente
	 */
	public setState(partialState: any, noEmit?: boolean): void {
		if (this._state == partialState) return
		const old = this._state
		this._state = { ...this._state, ...partialState }
		if (noEmit) return
		this.log(
			NamesLog.STATE_CHANGED,
			{ old, current: this._state, partial: partialState }
		)
	}

	//#endregion

	/**
	 * [facility] crea e trasmette un nuovo LOG
	 */
	protected log(name: string, payload?: any, type?: TypeLog) {
		const log: ILog = { name, source: nodePath(this), target: this, payload, type }
		this.state.onLog?.bind(this)(log);
		this.emitLog(log)
	}

	/**
	 * trasmette al parent un log
	 */
	protected emitLog(log: ILog) {
		if (!log) return
		(<NodeState>this.parent)?.emitLog?.(log)
	}

	//#region EXECUTE

	/**
	 * una mappa di ESECUTORI di ACTIONS per questo NODE
	 */
	protected get executablesMap(): ExecutablesMap {
		return {
			[NamesAction.SET_STATE]: async (newState: any) => this.setState(newState),
		}
	}

	/**
	 * permette di eseguire una ACTION di questo NODE
	 */
	execute(action: IAction): Promise<any> {
		let fnc = this.executablesMap[action.type]
		if (!fnc) {
			this.log(NamesLog.ERR_EXECUTE, `Action "${action.type}" not found`, TypeLog.ERROR)
			return
		}

		// se è una stringa allora è un nome di un metodo
		if (typeof fnc === "string") {
			fnc = this[fnc]
			if (!fnc) {
				this.log(NamesLog.ERR_EXECUTE, `Method "${fnc}" not found`, TypeLog.ERROR)
				return
			}
		}

		// se è ASYNC ritorna una PROMISE
		if (fnc.constructor.name === "AsyncFunction") {
			return new Promise(async (res, rej) => {
				try {
					const ret = await fnc(action.payload, action.sender, this)
					res(ret)
				} catch (error) {
					this.log(NamesLog.ERR_EXECUTE, error, TypeLog.ERROR)
					rej(error)
				}
			})
		}

		// altrimenti ritorna il valore
		try {
			return fnc(action.payload, action.sender, this)
		} catch (error) {
			this.log(NamesLog.ERR_EXECUTE, error, TypeLog.ERROR)
		}
	}

	/**
	 * [facility] permette di eseguire un DISPATCH ad un CHILD
	 */
	// dispatchTo(path: string, action: IAction): any {
	// 	return new Bus(this, path).dispatch(action)
	// }

	//#endregion
}

/**
 * una mappa di ACTIONS eseguiili
 */
export type ExecutablesMap = { [key: string]: Executor }

/**
 * la funzione eseguita tramite un ACTION
 * @param payload i dati delll'ACTION
 * @param target il NODE che ha ricevuto eseguito 
 * @param sender la path del NODE che ha inviato il DISPATCH
 */
type Executor = (payload?: any, sender?: string, target?: INode) => any
