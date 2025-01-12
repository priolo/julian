/**
 * @jest-environment node
 */

import axios from "axios"
import { Request, Response } from "express"
import { NamesAction } from "../../../core/types.js"
import { RootService } from "../../../core/RootService.js"
import { HttpRouterService } from "../HttpRouterService.js"

axios.defaults.adapter = require('axios/lib/adapters/http')


class TestRoute extends HttpRouterService {
	get stateDefault(): any {
		return {
			...super.stateDefault,
			routers: [
				{ path: "/test", verb: "get", method: "test" },
			]
		}
	}
	test(req: Request, res: Response) {
		res.json({ response: "test-ok" })
	}
}


let root = null

beforeEach(async () => {
	root = new RootService()
	await root.dispatch({
		type: NamesAction.INIT,
		payload: {
			children: [
				{
					class: "http",
					port: 5001,
					children: [
						{
							name: "test",
							class: "http-fs",
							path: "/filesystem",
						},
					]
				}
			]
		}
	})
})

afterEach(async () => {
	await root.dispatch({ type: NamesAction.DESTROY })
})


test("su creazione", async () => {
	const test = root.nodeByPath("/http/test")
	expect(test instanceof TestRoute).toBeTruthy()
})
test("request on route", async () => {
	const { data } = await axios.get("http://localhost:5001/admin/user")
	expect(data).toEqual({ response: "user-ok" })
})
test("request on subroute", async () => {
	const { data: d2 } = await axios.get("http://localhost:5001/sub/route2/test")
	expect(d2).toEqual({ response: "test-ok" })
})

test("request on subroute with header", async () => {
	let res = await axios.get(
		"http://localhost:5001/sub/route3/test",

	)
	expect(res.data).toEqual({ response: "with_header" })

	res = await axios.get(
		"http://localhost:5001/sub/route3/test",
		{
			headers: {
				"accept": ''
			}
		}
	)
	expect(res.data).toEqual({ response: "without_header" })
})

