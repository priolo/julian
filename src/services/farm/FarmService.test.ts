import { PathFinder } from "../../core/path/PathFinder.js"
import { RootService } from "../../core/RootService.js"
import { ServiceBase } from "../../core/service/ServiceBase.js"
import * as http from "../http/index.js"



class TestService extends ServiceBase {
	get prop() { return 54 }
}

let root: RootService

beforeAll(async () => {
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("import su 'services'", async () => {
	root = await RootService.Start([
		// string: internal name
		{
			class: "http",
			name: "poppo",
			port: 123
		},
	])

	const http = root.nodeByPath<http.Service>("/poppo")
	expect(http?.state.port).toBe(123)

})

test("import su class", async () => {
	const root: RootService = await RootService.Start([
		// class: class to istantiate
		{ class: TestService, name: "test" },
	])
	const test = root.nodeByPath<TestService>("/test")
	expect(test?.prop).toBe(54)
})

test("import su npm", async () => {
	const root: RootService = await RootService.Start([
		{
			class: `npm:julian-test-import`,
			name: "test3"
		}
	])
	const test = root.nodeByPath<TestService>("/test3")
	expect(test?.state.value1).toBe("pippo")
})
