import { RootService } from "../RootService.js"
import { NodeConf } from "../node/NodeConf.js"
import { findNodeByPath } from "../utils.js"



describe("PathFinder", () => {

	let root: RootService

	// creiamo priuma di tutto una struttura su cui "esercitarci"
	beforeAll(async () => {

		class Test extends NodeConf {
			get stateDefault() {
				return {
					...super.stateDefault,
					name: "test",
					value: "custom"
				}
			}
		}

		root = await RootService.Start([{
			name: "root2",
			value: 23,
			children: [
				{
					value: 55,
					name: "child1",
					children: [
						{ name: "child1.1" },
						{ name: "child1.2" },
						{
							name: "child1.3",
							value: "pippo",
							children: [
								{ name: "child1.3.1", value: "sigma" },
								{ name: "child1.3.2" }
							]
						}
					]
				},
				{
					name: "child2",
					children: [
						{ name: "child2.1" },
						{
							class: Test,
						}
					]
				}
			]
		}])
	})

	test("regular path", async () => {
		const node = findNodeByPath(root, "/root2/child2/child2.1")!
		expect(node).toBeDefined()
		expect(node.name).toBe("child2.1")
		const node2 = findNodeByPath(node, "..")!
		expect(node2?.name).toBe("child2")
		const node3 = findNodeByPath(node2, "/root2/child1")
		expect(node3?.name).toBe("child1")
	})

	test("find by id", async () => {
		const node1 = findNodeByPath(root, "/root2/child2/child2.1")
		const node2 = findNodeByPath(root, `/root2/child2/*${node1?.id}`)
		expect(node1).toBe(node2)
	})

	test("find deep", async () => {
		const node = findNodeByPath(root, "/>child2.1")!
		expect(node).toBeDefined()
		const node2 = findNodeByPath(root, `/>*${node.id}`)
		expect(node2).toBeDefined()
	})

	test("find by state", async () => {
		const node = findNodeByPath(root, '/>{"value":"pippo"}')!
		expect(node.name).toBe("child1.3")
		const node2 = findNodeByPath(root, '/root2/{"value":55}/child1.2')!
		expect(node2.name).toBe("child1.2")
	})

	test("find by class", async () => {
		const node = findNodeByPath(root, '/>~Test')!
		expect((<any>node).state.value).toBe("custom")
	})

	test("find parent", async () => {

		const node = findNodeByPath(root, "/>child1.3.1")!
		expect(node.name).toBe("child1.3.1")

		// trova il parent in base ad un pattern di ricerca
		const node2 = findNodeByPath(node, '<{"value":55}')!
		expect(node2.name).toBe("child1")
		// se non lo trova restituisce udefined
		const node3 = findNodeByPath(node, '<{"value":123}')
		expect(node3).toBeNull()
		// puo' essere anche il nodo stesso 
		const node4 = findNodeByPath(node, '<{"value":"sigma"}')
		expect(node4).toBe(node)

		// cerco un parent che abbia il nodo cercato tra i children
		const node5 = findNodeByPath(node, '^child1.2')!
		expect(node5.name).toBe("child1.2")

		// prendo la root
		const node6 = findNodeByPath(node, '/')
		expect(node6).toBe(root)
	})

})