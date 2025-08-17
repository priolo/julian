import { NodeState } from "./node/NodeState.js"

//#region ACTIONS

/**
 * ./NodeConf ACTIONS
 */
export enum NamesAction {

	/** [NODE STATE] setta lo stato parziale con il payload dell'ACTION */
	SET_STATE = "ns:set-state",

	/** [NODE CONF] genera tutta la struttura dei NODES da una `payload` di configurazione */
	INIT = "nc:init",
	/** [NODE CONF] Distrugge il NODE chiamando anche gli opportuni metodi */
	DESTROY = "nc:destroy",

	/** [SERVICE BASE] ricarica il nodo */
	RELOAD = "sb:reload",
}

/**
 * Una ACTION da spedire ad un NODE
 */
export interface IAction {
	/**
	 * tipo di ACTION da eseguire.
	 * praticamente è il nome della funzione da eseguire
	 * */
	type: string
	/**
	 * gli argomenti che servono all'ACTION
	 * possono essere qualsiasi cosa
	 * */
	payload?: any
	/**
	 * la path del NODE che ha inviato l'ACTION.
	 * Potrebbe non esserci (null) o essere valorizzato dal sistema
	 * */
	sender?: string
	/**
	 * se presente è il tempo che bisogna asettare prima di rinunciare a inviare il messaggio
	 * questo succede se per esempio un NODE non è raggiungibile o deve essere ancora creato
	 */
	wait?: number
	/**
	 * [UTC] inserito dal sistema. Indica quando è stato spedito il messaggio
	 */
	sendTime?: number
	/**
	 * cosa fare se c'e' un errore
	 * [II] questa è ridondante ripetto a "wait"
	 */
	error?: {
		/** numero di tentativi di ripetere l'action */
		reattempt: number
		/** millisecondi di attesa tra un tentativo e l'altro */
		wait: number
	}
}

//#endregion ACTION


//#region LOG

/**
 * tipologia/categoria di LOG
 * usato per filtrare i LOG
 */
export enum TypeLog {
	/** log di debug */
	DEBUG = "debug",
	/** log di informazione */
	INFO = "info",
	/** log di avviso */
	WARN = "warn",
	/** log di errore */
	ERROR = "error",
	/** log di errore grave */
	FATAL = "fatal",
	/** sono gli eventi interno di julian come INIT e DESTROY o l'update dei NODE */
	EVENT = "event",
	/** eventi dei nodi istanziati */
	SYSTEM = "system",
}

/**
 *  Oggetto mandato dall' EMITTER ai LISTENER quando c'e' un LOG
 * */
export interface ILog {
	/** NODE-TARGET dove è stato creato l'evento */
	source: string;
	/** NODE deove è stato creato l'evento */
	target?: NodeState;
	/** EVENT-NAME dell'evento avvenuto*/
	name: string;
	/** dati specifici dell'EVENT*/
	payload?: any;
	/** tipo di log */
	type?: TypeLog;
}

/**
 * Identifica lo specifico LOG che è stato creato
 */
export enum NamesLog {
	/** quando lo STATE del NODE cambia */
	STATE_CHANGED = "state:change",

	/** quando il NODE è inizializzato */
	NODE_INIT = "node:init",
	NODE_INIT_AFTER = "node:init-after",
	NODE_DELETED = "node:destroy",
	NODE_EXECUTE = "node:execute",

	/** [ERR] errore esecuzione di un ACTION */
	ERR_EXECUTE = "err:execute",
	ERR_INIT = "err:init",
	ERR_BUILD_CHILDREN = "err:build-children",
}

//#endregion LOG