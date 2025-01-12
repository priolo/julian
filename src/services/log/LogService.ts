import { log, LOG_TYPE } from "@priolo/jon-utils";
import { ILog, TypeLog } from "../../core/types.js";
import { ServiceBase } from "../../core/ServiceBase.js";



export type LogConf = Partial<LogService['stateDefault']> & { class: "log" }

/**
 * Permette di gestire i log.. per esempio su console o su file
 * essenzialmente utilizza winstonjs
 */
export class LogService extends ServiceBase {

	get stateDefault() {
		return {
			...super.stateDefault,
			levels: <TypeLog[]>null,
		}
	}

	/**
	 * Creao l'istanza del logger
	 */
	protected async onInitAfter(): Promise<void> {
		super.onInitAfter()
		const parent = this.nodeByPath<ServiceBase>("..")
		parent.emitter.on('$', msg => {
			const eventLog = msg.payload as ILog
			if (this.state.levels && !this.state.levels.includes(eventLog.type)) return
			const type = {
				[TypeLog.DEBUG]: LOG_TYPE.DEBUG,
				[TypeLog.INFO]: LOG_TYPE.INFO,
				[TypeLog.WARN]: LOG_TYPE.WARNING,
				[TypeLog.ERROR]: LOG_TYPE.ERROR,
				[TypeLog.FATAL]: LOG_TYPE.FATAL,
			}[eventLog.type] ?? LOG_TYPE.INFO
			log(`${eventLog.source ?? "--"} :: ${msg.event ?? "--"}`, type, eventLog.payload)
		})
	}
}
