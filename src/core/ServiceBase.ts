import { NodeConf } from "./node/NodeConf.js"
import { NamesLog, IAction, ILog, TypeLog, NamesAction } from "./types.js"
import { EventEmitter } from "@priolo/jon-utils"
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import * as path from 'path'

/**
 * E' la classe base di tutti i Service
 * Gestisce gli eventi
 */
export class ServiceBase extends NodeConf {

	constructor(name?: string, state?: any) {
		super(name, state)
		this._emitter = new EventEmitter()
	}

	/**
	 * Permette di emettere un evento
	 * serve per oggetti esterni ai nodi
	 */
	get emitter(): EventEmitter {
		return this._emitter
	}
	private _emitter: EventEmitter

	get executablesMap() {
		return {
			...super.executablesMap,
			[NamesAction.RELOAD]: async () => await this.reload(),
		}
	}

	/**
	 * trasmette al parent un log
	 * @override
	 */
	emitLog(log: ILog) {
		this.emitter.emit(log.name, log)
		super.emitLog(log)
	}

	/**
	 * emette un ACTION a tutti i "listeners"
	 * @override 
	 */
	async execute(action: IAction): Promise<any> {
		try {
			const res = await super.execute(action)
			this.log(NamesLog.NODE_EXECUTE, action)
			return res
		} catch (error) {
			this.log(NamesLog.ERR_EXECUTE, error, TypeLog.ERROR)
		}
	}

	/**
	 * Gets the current file path of this class
	 */
	protected getCurrentFilePath(): string {
		const fileName = fileURLToPath(import.meta.url)
		return path.resolve(dirname(fileName), path.basename(fileName))
	}

	/**
	 * Reloads the service from its source file
	 */
	async reload() {
		try {
			const filePath = this.getCurrentFilePath()
			
			// Re-import the module with cache busting
			const updatedModule = await import(
				`file://${filePath}?update=${Date.now()}`
			)
			const UpdatedClass = updatedModule.ServiceBase
			
			// Copy state to new instance
			const newInstance = new UpdatedClass(this.name, this.state)

			this.parent.removeChild(this)
			this.parent.addChild(newInstance)
			
			
			this.log(NamesLog.NODE_EXECUTE, { 
				type: NamesAction.RELOAD, 
				payload: "Service reloaded successfully" 
			})
		} catch (error) {
			this.log(NamesLog.ERR_EXECUTE, error, TypeLog.ERROR)
			throw error
		}
	}
}
