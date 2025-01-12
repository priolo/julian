import FarmService from "../services/farm/index.js";
import { NamesAction, TypeLog } from "./types.js";
import { ServiceBase } from "./ServiceBase.js";


/**
 * E' il nodo radice
 * - Permette il bootstap dell'applicazione 
 * - Contiene i Services
 * - Di default ha il service "farm"
 */
export class RootService extends ServiceBase {

	// [facility]: crea e avvia un json
	static async Start(config: any): Promise<RootService> {
		
		if (!Array.isArray(config)) config = [config]
		const root = new RootService()
		try {
			await root.setupByJson({ children: config })
		} catch (e) {
			root.log( "root-service:start", e, TypeLog.ERROR)
		}
		await root.execute({ type: NamesAction.INIT })
		return root
	}

	/**
	 * [facility] ferma un servizio
	 */
	static async Stop(service: ServiceBase) {
		if (service) await service.execute({ type: NamesAction.DESTROY })
	}

	constructor(name: string = "root") {
		super(name)

		// add farm service
		const farm = new FarmService()
		this.addChild(farm)

		// nel caso in cui l'app venga chiusa
		process.on('SIGTERM', async () => {
			console.debug('SIGTERM signal received: closing all services')
			await this.execute({ type: NamesAction.DESTROY })
		})
	}

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "root",
		}
	}

}
