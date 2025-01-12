/**
 * Definisce la struttura ad albero dei Node
 */
 export interface INode {

	/**
	 * identifier of the NODE
	 */
	id:string
	/**
	 * NODE name. It is also used by the PATHFIEND
	 */
	name:string

	/**
	 * NODE che contiene questo NODE. Se null è alla radice dell'albero
	 */
	parent:INode | null

	/**
	 * NODES contenuti da questo NODE
	 */
	readonly children:INode[]

	/**
	 * Aggiunge un NODE come figlio di questo NODE
	 */
	addChild(child: INode): void

	/**
	 * Rimuove un NODE figlio di questo NODE
	 */
	removeChild(child: INode): void

	/**
	 * restituisce il NODE collegato a questo tramite la "path"
	 */
	nodeByPath<T extends INode>(path: string): T | null
	
}