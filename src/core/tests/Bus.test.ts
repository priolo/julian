import { RootService } from "../RootService.js"
import { NodeConf } from "../node/NodeConf.js"
import { NodeState } from "../node/NodeState.js"
import { Bus } from "../path/Bus.js"



let root: RootService

class TestNode extends NodeConf {

	private tryError = 3

	get executablesMap(): any {
		return {
			...super.executablesMap,
			SetState: (payload: any) => {
				this.setState({ value: payload })
				return "pluto"
			},
			TryError: async () => {
				if (this.tryError > 0) {
					this.tryError--
					throw `error ${this.tryError}`
				}
				return "ok"
			},
		}
	}
}

describe('Bus', () => {

    beforeAll(async () => {
        root = await RootService.Start([
            {
                name: "child1",
                children: [
                    { name: "child1.1" },
                    {
                        class: TestNode,
                        name: "child1.2",
                        value: "pippo"
                    }
                ]
            },
            {
                name: "child2",
                children: [
                    { name: "child2.1" }
                ]
            }
        ])
    })

    afterAll(async () => {
        RootService.Stop(root)
    })

    test("setup", async () => {
        const node = root?.children.find(n => n.name == "child1")?.children.find(n => n.name == "child1.2")
        expect(node).toBeInstanceOf(TestNode)
    })

    test("send action", async () => {
        const ret = await new Bus(root, "/child1/child1.2").dispatch({
            type: "SetState",
            payload: "topolino",
        })
        expect(ret).toBe("pluto")
        const node: NodeState = root?.children.find(n => n.name == "child1")?.children.find(n => n.name == "child1.2") as NodeState
        expect(node.state.value).toBe("topolino")
    })

    test("error wait", async () => {
        const ret = await new Bus(root, "/child1/child1.2").dispatch({
            type: "TryError",
            error: { reattempt: 3, wait: 300 }
        })
        expect(ret).toBe("ok")
    })
})

