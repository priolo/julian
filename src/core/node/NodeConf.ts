import FarmService from "../../services/farm/index.js";
import { nodeForeach } from "../utils.js";
import { INode } from "./INode.js";
import { NodeState } from "./NodeState.js";
import { NamesAction, NamesLog, TypeLog } from "../types.js";



/**
 * Classe responsabile di:  
 * - inizializzare il NODE
 * - distruggere il NODE
 * - costruire i CHILDREN attraverso il CONF   
 */
export class NodeConf extends NodeState {

	/**
	 * Contiene le ACTIONs eseguibili
	 */
	get executablesMap() {
		return {
			...super.executablesMap,
			[NamesAction.INIT]: async () => await this.init(),
			[NamesAction.DESTROY]: async () => await this.nodeDestroy(),
		}
	}

	/**
	 * Inizializza il NODE e i suoi children
	 * */
	private async init(): Promise<void> {

		// inizializzo questo NODE PRIMA di creare i CHILDREN
		try {
			await this.onInit()
		} catch (error) {
			this.log(NamesLog.ERR_INIT, error, TypeLog.ERROR)
			return
		}

		// creo e inizializzo i CHILDREN
		for (const child of this.children) {
			await (<NodeConf>child).execute?.({ type: NamesAction.INIT })
		}

		// chiamo la procedure DOPO creazione/init CHILDREN
		await this.onInitAfter()

		// se questo nodo è il nodo "root" allora richiama ricorsivamente tutti i nodi
		// per chiamare l'evento onInitFinish
		if (this.parent == null) {
			await nodeForeach(this, async (n) => {
				await (<NodeConf>n).onInitFinish?.();
			})
		}
	}

	/**
	 * Chiamata PRIMA della creazione dei CHILDREN 
	 * [LOG] NODE_INIT
	 */
	protected async onInit(): Promise<void> { 
		this.log(NamesLog.NODE_INIT, null, TypeLog.SYSTEM)
	}

	/**
	 * Chiamata DOPO l'inizializzazione di tutti i CHILDREN
	 * [LOG] NODE_INIT_AFTER
	 */
	protected async onInitAfter(): Promise<void> { 
		this.log(NamesLog.NODE_INIT_AFTER, null, TypeLog.SYSTEM)
	}

	/**
	 * Chiamata dopo l'inizializzazione di tutto l'albero
	 */
	protected async onInitFinish(): Promise<void> { }

	/**
	 * Valorizza questo NODE e costruisce tutti i children tramite il parametro JSON
	 */
	async setupByJson(json: any = {}): Promise<void> {

		// faccio una copia e tolgo "children" e "class"
		const state = { ...json }
		delete state.children
		delete state.class
		delete state.name
		// setto il config come stato iniziale
		this.setState(state)

		// [II] inserire i COMMANDS in MAP
		//this.setCommands(json.commands)

		// se il config ha pure un "name" lo setto come identificativo del NODE
		if (json.name) this.name = json.name

		// prendo tutti i children presenti nel json e li creo
		const confChildren: any[] = (json.children ?? []).filter((child: any) => child != null)
		await this.buildChildrenByJson(confChildren)
	}

	/**
	 * Creo i children e ricorsivamente chiamo "buildByJson"
	 */
	private async buildChildrenByJson(jsonChildren: Array<any>): Promise<void> {
		for (const confChild of jsonChildren) {
			try {
				const child = await this.buildChildByJson(confChild);
				if (child == null) continue;
				this.addChild(child);
				await (<NodeConf>child).setupByJson?.(confChild);
			} catch (error) {
				this.log(NamesLog.ERR_BUILD_CHILDREN, error, TypeLog.ERROR);
			}
		}
	}

	/**
	 * Dato un JSON costruisce il nodo corrispondente
	 * [II] deve prendere la "farm" piu' vicina
	 * [II] deve fare una build asincrona
	 */
	private async buildChildByJson(json: any): Promise<INode | null> {
		const farm = this.nodeByPath<FarmService>("/farm")
		if (!farm) throw new Error("FarmService not found")
		return await farm.build(json)
	}

	/**
	 * Quando questo NODE deve essere distrutto
	 */
	private async nodeDestroy(): Promise<void> {
		const children = [...this.children]
		for (const child of children) {
			await (<NodeConf>child).execute?.({ type: NamesAction.DESTROY })
		}
		await this.onDestroy()
		this.parent?.removeChild(this)
	}

	/**
	 * chiamato DOPO aver distrutto i CHILDREN
	 * [LOG] NODE_DELETED
	 */
	protected async onDestroy(): Promise<void> { 
		this.log(NamesLog.NODE_DELETED, null, TypeLog.SYSTEM)
	}

}