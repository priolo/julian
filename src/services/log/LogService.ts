import { log, LOG_TYPE } from "@priolo/jon-utils";
import { ServiceBase } from "../../core/ServiceBase.js";
import { ILog, TypeLog } from "../../core/types.js";



export type LogConf = Partial<LogService['stateDefault']> & { class: "log" }

/**
 * Permette di gestire i log.. per esempio su console o su file
 * essenzialmente utilizza winstonjs
 */
export class LogService extends ServiceBase {

	get stateDefault() {
		return {
			...super.stateDefault,
			/** I tipi di log da escludere */
			exclude: <TypeLog[]>null,
			/** I SOLI tipi di log da includere (se specificati) */
			include: <TypeLog[]>null,
			/** Se devo effettuare un log su stdout */
			stdout: true,
			/** evento su ricezione di un LOG da parte del parent*/
			onParentLog: <((log: ILog) => void | boolean) | null>null,
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
			if (!eventLog.type) eventLog.type = TypeLog.EVENT

			// Se il tipo è escluso non lo loggo
			if (!!this.state.exclude && this.state.exclude.includes(eventLog.type)) return

			// Se il tipo è non è tra gli "include" non lo loggo
			if (!!this.state.include && !this.state.include.includes(eventLog.type)) return

			// Se c'e' un onLog lo chiamo
			if (this.state.onParentLog) {
				const res = this.state.onParentLog(eventLog)
				if ( res === false) return
			}

			// Se devo loggare su console
			if (this.state.stdout) {
				const type = {
					[TypeLog.DEBUG]: LOG_TYPE.DEBUG,
					[TypeLog.INFO]: LOG_TYPE.INFO,
					[TypeLog.WARN]: LOG_TYPE.WARNING,
					[TypeLog.ERROR]: LOG_TYPE.ERROR,
					[TypeLog.FATAL]: LOG_TYPE.FATAL,
				}[eventLog.type] ?? LOG_TYPE.INFO
				log(`${eventLog.source ?? "--"} :: ${msg.event ?? "--"}`, type, eventLog.payload)
			}

			
		})
	}
}
