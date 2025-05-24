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
			/** log minimo di ascolto */
			levels: <TypeLog[]>null,
			/** evento su ricezione di un LOG */
			onLog: <(log: ILog) => void>null,
		}
	}

	/**
	 * Creao l'istanza del logger
	 */
	protected async onInitAfter(): Promise<void> {
		await super.onInitAfter()
		const parent = this.nodeByPath<ServiceBase>("..")
		parent.emitter.on('$', msg => {
			const eventLog = msg.payload as ILog

			// Se non sono in ascolto su questo tipo di log non lo stampo
			if (this.state.levels && !this.state.levels.includes(eventLog.type)) return
			const type = {
				[TypeLog.DEBUG]: LOG_TYPE.DEBUG,
				[TypeLog.INFO]: LOG_TYPE.INFO,
				[TypeLog.WARN]: LOG_TYPE.WARNING,
				[TypeLog.ERROR]: LOG_TYPE.ERROR,
				[TypeLog.FATAL]: LOG_TYPE.FATAL,
			}[eventLog.type] ?? LOG_TYPE.INFO
			log(`${eventLog.source ?? "--"} :: ${msg.event ?? "--"}`, type, eventLog.payload)
			
			// Se c'e' un onLog lo chiamo
			if ( this.state.onLog) this.state.onLog(eventLog)
		})
	}
}
