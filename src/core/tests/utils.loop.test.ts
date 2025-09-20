import { NodeConf } from "../node/NodeConf.js";
import { nodeForeach, nodeFind, nodesFind } from "../utils.js";
import { INode } from "../node/INode.js";



let root: NodeConf;

describe("CORE UTILS - LOOP FUNCTIONS", () => {

	beforeEach(async () => {
		// Create a test tree structure for each test
		root = new NodeConf("root");
		
		// Create children
		const child1 = new NodeConf("child1");
		const child2 = new NodeConf("child2");
		const child3 = new NodeConf("child3");
		
		// Create grandchildren
		const grandchild1_1 = new NodeConf("grandchild1_1");
		const grandchild1_2 = new NodeConf("grandchild1_2");
		const grandchild2_1 = new NodeConf("grandchild2_1");
		
		// Build the tree structure
		root.addChild(child1);
		root.addChild(child2);
		root.addChild(child3);
		
		child1.addChild(grandchild1_1);
		child1.addChild(grandchild1_2);
		child2.addChild(grandchild2_1);
	});

	describe("nodeForeach", () => {

		test("should call callback for each node in a single node", async () => {
			const visited: string[] = [];
			const singleNode = new NodeConf("single");
			
			await nodeForeach(singleNode, async (node: INode) => {
				visited.push(node.name);
			});
			
			expect(visited).toEqual(["single"]);
		});

		test("should call callback for each node in depth-first order", async () => {
			const visited: string[] = [];
			
			await nodeForeach(root, async (node: INode) => {
				visited.push(node.name);
			});
			
			// Should visit in depth-first order: root, child1, grandchild1_1, grandchild1_2, child2, grandchild2_1, child3
			expect(visited).toEqual([
				"root",
				"child1",
				"grandchild1_1",
				"grandchild1_2", 
				"child2",
				"grandchild2_1",
				"child3"
			]);
		});

		test("should handle array of nodes", async () => {
			const visited: string[] = [];
			const nodes = root.children;
			
			await nodeForeach(nodes, async (node: INode) => {
				visited.push(node.name);
			});
			
			// Should visit all children and their descendants
			expect(visited).toEqual([
				"child1",
				"grandchild1_1",
				"grandchild1_2",
				"child2", 
				"grandchild2_1",
				"child3"
			]);
		});

		test("should handle undefined input gracefully", async () => {
			const visited: string[] = [];
			
			await nodeForeach(undefined as any, async (node: INode) => {
				visited.push(node.name);
			});
			
			expect(visited).toEqual([]);
		});

		test("should handle empty array", async () => {
			const visited: string[] = [];
			
			await nodeForeach([], async (node: INode) => {
				visited.push(node.name);
			});
			
			expect(visited).toEqual([]);
		});

		test("should support async operations in callback", async () => {
			const visited: string[] = [];
			const delays: number[] = [];
			
			await nodeForeach(root, async (node: INode) => {
				const start = Date.now();
				await new Promise(resolve => setTimeout(resolve, 10));
				const end = Date.now();
				delays.push(end - start);
				visited.push(node.name);
			});
			
			expect(visited.length).toBe(7);
			expect(delays.every(delay => delay >= 10)).toBe(true);
		});

	});

	describe("nodeFind", () => {

		test("should find node by name", () => {
			const result = nodeFind(root, (node: INode) => node.name === "grandchild1_2");
			
			expect(result).not.toBeNull();
			expect(result?.name).toBe("grandchild1_2");
		});

		test("should find first matching node", () => {
			// Add another node with the same name
			const duplicateChild = new NodeConf("child1");
			root.children[2].addChild(duplicateChild);
			
			const result = nodeFind(root, (node: INode) => node.name === "child1");
			
			// Should return the first child1 (direct child of root)
			expect(result).not.toBeNull();
			expect(result?.name).toBe("child1");
			expect(result?.parent).toBe(root);
		});

		test("should return null when no node matches", () => {
			const result = nodeFind(root, (node: INode) => node.name === "nonexistent");
			
			expect(result).toBeNull();
		});

		test("should search in depth-first order", () => {
			const searchOrder: string[] = [];
			
			nodeFind(root, (node: INode) => {
				searchOrder.push(node.name);
				return node.name === "grandchild2_1";
			});
			
			// Should visit nodes in depth-first order until finding the target
			expect(searchOrder).toEqual([
				"root",
				"child1", 
				"grandchild1_1",
				"grandchild1_2",
				"child2",
				"grandchild2_1"
			]);
		});

		test("should handle single node", () => {
			const singleNode = new NodeConf("single");
			
			const foundResult = nodeFind(singleNode, (node: INode) => node.name === "single");
			const notFoundResult = nodeFind(singleNode, (node: INode) => node.name === "other");
			
			expect(foundResult).toBe(singleNode);
			expect(notFoundResult).toBeNull();
		});

		test("should handle array of nodes", () => {
			const nodes = root.children;
			
			const result = nodeFind(nodes, (node: INode) => node.name === "grandchild1_1");
			
			expect(result).not.toBeNull();
			expect(result?.name).toBe("grandchild1_1");
		});

		test("should handle undefined input gracefully", () => {
			const result = nodeFind(undefined as any, (node: INode) => node.name === "any");
			
			expect(result).toBeUndefined();
		});

		test("should handle empty array", () => {
			const result = nodeFind([], (node: INode) => node.name === "any");
			
			expect(result).toBeNull();
		});

		test("should find node by custom criteria", () => {
			// Find first node that has children
			const result = nodeFind(root, (node: INode) => node.children.length > 0 && node.name !== "root");
			
			expect(result).not.toBeNull();
			expect(result?.name).toBe("child1");
			expect(result?.children.length).toBeGreaterThan(0);
		});

		test("should find node by id", () => {
			const targetId = root.children[1].children[0].id;
			
			const result = nodeFind(root, (node: INode) => node.id === targetId);
			
			expect(result).not.toBeNull();
			expect(result?.name).toBe("grandchild2_1");
			expect(result?.id).toBe(targetId);
		});

		test("should return correct node when searching from different starting points", () => {
			// Search from root
			const fromRoot = nodeFind(root, (node: INode) => node.name === "grandchild1_1");
			
			// Search from child1 only
			const fromChild1 = nodeFind(root.children[0], (node: INode) => node.name === "grandchild1_1");
			
			// Search from child2 (should not find grandchild1_1)
			const fromChild2 = nodeFind(root.children[1], (node: INode) => node.name === "grandchild1_1");
			
			expect(fromRoot).not.toBeNull();
			expect(fromChild1).not.toBeNull();
			expect(fromChild2).toBeNull();
			
			expect(fromRoot?.name).toBe("grandchild1_1");
			expect(fromChild1?.name).toBe("grandchild1_1");
		});

	});

	describe("nodesFind", () => {

		test("should find all nodes matching criteria", () => {
			// Add another child with name starting with "child"
			const child4 = new NodeConf("child4");
			root.addChild(child4);
			
			const result = nodesFind(root, (node: INode) => node.name.startsWith("child"));
			
			expect(result).toHaveLength(4);
			expect(result.map(n => n.name)).toEqual(["child1", "child2", "child3", "child4"]);
		});

		test("should find all nodes with specific property", () => {
			// Find all nodes that have children
			const result = nodesFind(root, (node: INode) => node.children.length > 0);
			
			expect(result).toHaveLength(3); // root, child1, child2
			const names = result.map(n => n.name).sort();
			expect(names).toEqual(["child1", "child2", "root"]);
		});

		test("should return empty array when no nodes match", () => {
			const result = nodesFind(root, (node: INode) => node.name === "nonexistent");
			
			expect(result).toEqual([]);
		});

		test("should find all grandchildren", () => {
			const result = nodesFind(root, (node: INode) => node.name.startsWith("grandchild"));
			
			expect(result).toHaveLength(3);
			expect(result.map(n => n.name).sort()).toEqual(["grandchild1_1", "grandchild1_2", "grandchild2_1"]);
		});

		test("should handle single node", () => {
			const singleNode = new NodeConf("single");
			
			const foundResult = nodesFind(singleNode, (node: INode) => node.name === "single");
			const notFoundResult = nodesFind(singleNode, (node: INode) => node.name === "other");
			
			expect(foundResult).toHaveLength(1);
			expect(foundResult[0]).toBe(singleNode);
			expect(notFoundResult).toEqual([]);
		});

		test("should handle array of nodes", () => {
			const nodes = root.children;
			
			const result = nodesFind(nodes, (node: INode) => node.name.includes("1"));
			
			expect(result).toHaveLength(4);
			expect(result.map(n => n.name).sort()).toEqual(["child1", "grandchild1_1", "grandchild1_2", "grandchild2_1"]);
		});

		test("should handle undefined input gracefully", () => {
			const result = nodesFind(undefined as any, (node: INode) => node.name === "any");
			
			expect(result).toEqual([]);
		});

		test("should handle empty array", () => {
			const result = nodesFind([], (node: INode) => node.name === "any");
			
			expect(result).toEqual([]);
		});

		test("should find nodes by id", () => {
			const targetIds = [root.children[0].id, root.children[1].children[0].id];
			
			const result = nodesFind(root, (node: INode) => targetIds.includes(node.id));
			
			expect(result).toHaveLength(2);
			expect(result.map(n => n.name).sort()).toEqual(["child1", "grandchild2_1"]);
		});

		test("should find all leaf nodes (nodes without children)", () => {
			const result = nodesFind(root, (node: INode) => node.children.length === 0);
			
			expect(result).toHaveLength(4); // grandchild1_1, grandchild1_2, grandchild2_1, child3
			expect(result.map(n => n.name).sort()).toEqual(["child3", "grandchild1_1", "grandchild1_2", "grandchild2_1"]);
		});

		test("should find nodes at specific depth level", () => {
			// Find all nodes at depth 2 (grandchildren)
			const result = nodesFind(root, (node: INode) => {
				let depth = 0;
				let current = node;
				while (current.parent) {
					depth++;
					current = current.parent;
				}
				return depth === 2;
			});
			
			expect(result).toHaveLength(3); // all grandchildren
			expect(result.map(n => n.name).sort()).toEqual(["grandchild1_1", "grandchild1_2", "grandchild2_1"]);
		});

		test("should find all nodes matching complex criteria", () => {
			// Find all nodes whose name length is greater than 6 characters
			const result = nodesFind(root, (node: INode) => node.name.length > 6);
			
			expect(result).toHaveLength(3); // all grandchildren have names > 6 chars
			expect(result.map(n => n.name).sort()).toEqual(["grandchild1_1", "grandchild1_2", "grandchild2_1"]);
		});

		test("should search from different starting points", () => {
			// Search from root - should find all nodes containing "child"
			const fromRoot = nodesFind(root, (node: INode) => node.name.includes("child"));
			
			// Search from child1 only - should find child1 and its grandchildren
			const fromChild1 = nodesFind(root.children[0], (node: INode) => node.name.includes("child"));
			
			// Search from grandchild1_1 - should only find itself
			const fromGrandchild = nodesFind(root.children[0].children[0], (node: INode) => node.name.includes("child"));
			
			expect(fromRoot).toHaveLength(6); // child1, child2, child3, grandchild1_1, grandchild1_2, grandchild2_1
			expect(fromChild1).toHaveLength(3); // child1, grandchild1_1, grandchild1_2
			expect(fromGrandchild).toHaveLength(1); // grandchild1_1
			
			expect(fromGrandchild[0].name).toBe("grandchild1_1");
		});

	});

});