import { Node } from "../node/Node.js"

describe("NODE", () => {

	/**
	Se volessi creare un NODE con nome "root" senza nessun figlio
	una cosa semplice semplice
	 */
	test("creation", () => {
		const root = new Node("root")
		expect(root.children.length == 0).toBe(true)
	})

	/**
	Oppure creare un NODE e poi inserirci dentro altri NODEs come "children"
	 */
	test("add child", () => {
		// creo il NODE "root"
		const root = new Node("root")
		// creo il NODE "child1"
		const child1 = new Node("child1")
		// inserisco in "child1" il NODE "child1.1"
		child1.addChild(new Node("child1.1"))
		// inserisco in "child1" il NODE "child1.2"
		child1.addChild(new Node("child1.2"))
		// in fine "child1" nel NODE-ROOT
		root.addChild(child1)
		root.addChild(new Node("child2"))

		// mi aspetto che "root" abbia due CHILDREN
		expect(root.children.length == 2).toBe(true)
		expect(child1.children.length == 2).toBe(true)
		const node1_2 = root.children
			.find(n => n.name == "child1")?.children
			.find(n => n.name == "child1.2")
		expect(node1_2).not.toBeNull()

		// e che "child1" abbia un parent
		expect(child1.parent).not.toBeNull()
	})

	/**
	Chiaramente un NODE inserito si puo' anche togliere
	 */
	test("remove child", () => {
		const root = new Node("root")
		const child1 = new Node("child1")
		root.addChild(child1)
		root.addChild(new Node("child2"))
		root.addChild(new Node("child3"))
		expect(root.children.length == 3).toBe(true)
		root.removeChild(1) // child2
		root.removeChild(child1)
		expect(root.children.length == 1).toBe(true)
	})

	/**
	 * Se volessi cercare un NODE tra i CHILDREN di un NODE
	 */
	test("get child", () => {
		const root = new Node("root")
		const child1 = new Node("child1")
		root.addChild(child1)
		root.addChild(new Node("child2"))
		root.addChild(new Node("child3"))
		const child = root.nodeByPath("child1")
		expect(child).not.toBeNull()
	})
})