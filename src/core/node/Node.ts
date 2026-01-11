import { findNodeByPath, nodeId } from "../utils.js";
import { INode } from "./INode.js";



/**
 * Classe responsabile di mantenere la struttura ad albero
 */
export class Node implements INode {

	constructor(name: string = "node") {
		this.name = name
	}

	id: string = nodeId()

	name: string

	parent: INode | null = null

	get children(): INode[] {
		return this._children;
	}
	protected _children: INode[] = [];

	addChild(child: INode): void {
		if (child == null) throw new Error("ivalid parameter")
		this._children.push(child)
		child.parent = this
	}

	removeChild(child: INode | number): void {
		const index = typeof child != "number" ? this.indexChild(child) : child
		if (index == -1) return;
		this._children.splice(index, 1)
			.forEach(n => n.parent = null)
	}

	private indexChild(child: INode): number {
		if (child == null) return -1
		return this._children.indexOf(child)
	}

	/**
	 * Cerca un NODO a partire da un PATH
	 * @param path path del nodo da trovare
	 * @returns il nodo trovato o null
	 * @example
	 * // regolare
	 * node.nodeByPath("/root2/child2/child2.1")
	 * // relativo
	 * node.nodeByPath("..")
	 * // by id
	 * node.nodeByPath("/root2/child2/*nodeId")
	 * // deep
	 * node.nodeByPath("/>child2.1")
	 * // by state
	 * node.nodeByPath('/>{"value":"pippo"}')
	 * // by class
	 * node.nodeByPath('/>~Test')
	 * // find parent
	 * node.nodeByPath('<child1.2')
	 */
	nodeByPath<T extends INode>(path: string): T | null {
		return findNodeByPath<T>(<any>this, path)
	}

}