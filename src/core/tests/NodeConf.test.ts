import { RootService } from "../../index.js"
import { NodeConf } from "../node/NodeConf.js"


/**
L'implementazione `NodeState` è un NODE che ha l'`action` CREATE.
Questa `action` permette di creare tutta la struttura dei propri `children`  
tramite un semplice `json`  
Quindi invece di creare i nodi uno a uno per inserirli uno dentro l'altro   
posso usare un solo `json`... in pratica mi facilita il lavoro!
 */

describe("NODE CONF", () => {

	test("Creazione dei children con il json di configurazione", async () => {
		// creo il nodo e ci metto dentro "FarmService" 
		// questo SERVICE permette di creare un NODE da un oggetto di tipo json
		// va messo nel nodo "root"
		const root = await RootService.Start([
			{
				name: "child1",
				children: [
					{ name: "child1.1" },
					{ name: "child1.2" }
				]
			},
			{
				name: "child2",
				children: [
					{ name: "child2.1" }
				]
			}
		])

		// controllo sia tutto ok
		expect(root.name).toBe("root")
		//expect(root.state.value).toBe(23)
		expect(root.children.map(c => c.name)).toContain("child1")
		expect(root.children
			.find(c => c.name == "child1")?.children
			.map(c => c.name)
		).toContain("child1.2")
	})

	test("inheritance of config", async () => {
		class NodeA extends NodeConf {
			get stateDefault(): any {
				return {
					...super.stateDefault,
					propA: "A", propOver: "A", propOver2: "A"
				}
			}
		}

		class NodeB extends NodeA {
			get stateDefault(): any {
				return {
					...super.stateDefault,
					propB: "B", propOver: "B", propOver2: "B"
				}
			}
		}
		
		const root = await RootService.Start([
			{
				name: "nodeB",
				class: NodeB,
				propOver2: "B2"
			}
		])
		const node = <NodeB>root.children[1]
		expect(node.state.propA).toBe("A")
		expect(node.state.propB).toBe("B")
		expect(node.state.propOver).toBe("B")
		expect(node.state.propOver2).toBe("B2")
	})

	test("call init", async () => {

		const root = new NodeConf("root")
		const node1 = new NodeConf("node1")
		const node1_1 = new NodeConf("node1.1")
		const node2 = new NodeConf("node2")

		root.addChild(node1)
		node1.addChild(node1_1)
		root.addChild(node2)
	})
})