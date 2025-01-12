import axios, { AxiosInstance } from "axios"
import path from "path"
import { RootService } from "../../../core/RootService.js"
import { PathFinder } from "../../../core/path/PathFinder.js"
import * as typeormNs from "../../typeorm/index.js"
import { getFreePort } from "../../ws/index.js"
import { HttpSessionService } from "../session/HttpSessionService.js"
import { SessionEntity } from "../session/SessionEntity.js"
import { fileURLToPath } from 'url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

let PORT: number
let axiosIstance: AxiosInstance
const dbPath = path.join(__dirname, "/database.sqlite")
let root: RootService

beforeAll(async () => {
	PORT = await getFreePort()
	axiosIstance = axios.create({ baseURL: `http://localhost:${PORT}`, withCredentials: true });

	root = await RootService.Start([
		{
			class: "http",
			port: PORT,
			children: [
				{
					name: "mem-session",
					class: "http-router/session",
					path: "/mem",
					children: [
						{
							class: "http-router",
							path: "/",
							routers: [
								{
									path: "/write", verb: "post",
									method: (req, res, next) => {
										req.session.value = req.body.value
										res.json({ res: "ok" })
									}
								},
								{
									path: "/read", verb: "get",
									method: (req, res, next) => {
										res.json({ value: req.session.value })
									}
								},
							]
						}
					]
				},
				{
					name: "typeorm-session",
					class: "http-router/session",
					typeorm: "/typeorm",
					path: "/type",
					children: [
						{
							class: "http-router",
							path: "/",
							routers: [
								{
									path: "/write", verb: "post",
									method: (req, res, next) => {
										req.session.value = req.body.value
										res.json({ res: "ok" })
									}
								},
								{
									path: "/read", verb: "get",
									method: (req, res, next) => {
										res.json({ value: req.session.value })
									}
								},
							]
						}
					]
				},
			]
		},
		{
			class: "typeorm",
			options: {
				"type": "sqlite",
				"database": dbPath,
				"synchronize": true,
				"entities": [SessionEntity],
			},
		}
	])
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("creazione", async () => {
	const sesMem = new PathFinder(root).getNode<HttpSessionService>("/http/mem-session")
	expect(sesMem).toBeInstanceOf(HttpSessionService)

	const sesType = new PathFinder(root).getNode<HttpSessionService>("/http/typeorm-session")
	expect(sesType).toBeInstanceOf(HttpSessionService)

	const typeorm = new PathFinder(root).getNode<typeormNs.Service>("/typeorm")
	expect(typeorm).toBeInstanceOf(typeormNs.Service)
})

test("write and read in mem", async () => {
	let res = await axiosIstance.post<any>("/mem/write", { value: "pippo" })
	res = await axiosIstance.get(
		"/mem/read",
		{
			headers: {
				Cookie: res.headers["set-cookie"]?.[0]
			}
		}
	)
	expect(res.data.value).toBe("pippo")
})

test("write and read in typeorm", async () => {
	let res = await axiosIstance.post<any>("/type/write", { value: "pippo" })
	res = await axiosIstance.get(
		"/type/read",
		{
			headers: {
				Cookie: res.headers["set-cookie"]?.[0]
			}
		}
	)
	expect(res.data.value).toBe("pippo")
})