import { RootService, utils } from "../../index.js"



describe("ROOT SERVICE", () => {

	test("su creazione", async () => {
		const root = await RootService.Start([{
			name: "node.1",
			// valore inserito nello STATE di questo NODE
			value: "1",
			children: [
				// anche qui inserisco "val_text" e "val_number" nei rispettivi NODEs
				{ name: "node.1.1", val_text: "1.1" },
				{ name: "node.1.2", val_number: 1.2 }
			]
		}])

		const struct = utils.nodeToStruct(root)
		expect(struct).toMatchObject({
			name: "root",
			state: { name: "root", onLog: null },
			commands: ["init", "destroy"],
			children: [
				{
					name: "farm",
					children: [],
				},
				{
					name: "node.1",
					state: { value: "1" },
					commands: ["init", "destroy"],
					children: [
						{
							name: "node.1.1",
							state: { val_text: "1.1" },
							commands: ["init", "destroy"],
							children: [],
						},
						{
							name: "node.1.2",
							state: { val_number: 1.2 },
							commands: [
								"init",
								"destroy",
							],
							children: [],
						},
					],
				},
			],
		})
	})
})