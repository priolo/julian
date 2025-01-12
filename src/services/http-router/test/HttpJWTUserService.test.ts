import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import { RootService } from "../../../core/RootService.js";
import { Bus } from "../../../core/path/Bus.js";
import { PathFinder } from "../../../core/path/PathFinder.js";
import { RepoRestActions } from "../../../core/service/utils.js";
import { getFreePort } from "../../ws/index.js";
import * as jwt from "../jwt/index.js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

let PORT: number
let axiosIstance: AxiosInstance
const dbPath = `${__dirname}/database.sqlite`
let root: RootService
let user1, user2, token: string

beforeAll(async () => {
	PORT = await getFreePort()
	axiosIstance = axios.create({ baseURL: `http://localhost:${PORT}`, withCredentials: true })
	try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath) } catch (e) { console.log(e) }

	root = await RootService.Start([
		{
			class: "http",
			port: PORT,
			children: [
				{
					class: "http-router",
					path: "/user",
					routers: [
						{
							path: "/login/:id", method: async function (req, res, next) {
								const userId = req.params.id

								// get user or any payload
								const user = await new Bus(this, "/typeorm/user").dispatch({
									type: RepoRestActions.GET_BY_ID,
									payload: userId,
								})

								const jwtService = PathFinder.Get<jwt.Service>(root, "/http/route-jwt")
								const token = await jwtService.putPayload(user, res)

								res.json({ token })
							}
						}
					]
				},
				{
					class: "http-router/jwt",
					repository: "/typeorm/user",
					jwt: "/jwt",
					strategy: jwt.HeaderStrategy,
					children: [
						{
							class: "http-router",
							path: "/user",
							routers: [
								{ method: (req, res, next) => res.json(req.jwtPayload) },
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
			},
			schemas: [{
				name: "User",
				columns: {
					id: { type: Number, primary: true, generated: true },
					username: { type: String }
				}
			}],
			children: [
				{
					name: "user",
					class: "typeorm/repo",
					model: "User"
				}
			]
		},
		{
			class: "jwt",
			secret: "secret_word!!!"
		},
	])
})

afterAll(async () => {
	await RootService.Stop(root)
	try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath) } catch (e) { console.log(e) }
})

test("creazione", async () => {
	const rjwt = new PathFinder(root).getNode<jwt.Service>("/http/route-jwt")
	expect(rjwt).toBeInstanceOf(jwt.Service)
})

test("crea due USER", async () => {
	user1 = await new Bus(root, "/typeorm/user").dispatch({ type: RepoRestActions.SAVE, payload: { username: "priolo" } })
	user2 = await new Bus(root, "/typeorm/user").dispatch({ type: RepoRestActions.SAVE, payload: { username: "zago" } })
	expect(user1).toBeDefined()
	expect(user2).toBeDefined()
})

test("se accedo SENZA il token ... mi dovrebbe dare errore", async () => {
	let err: any = null
	try {
		await axiosIstance.get(`/user`)
	} catch (e) {
		err = e
	}
	expect(err.response.status).toBe(401)
})

test("simulo il login e ricavo il token", async () => {
	const { data } = await axiosIstance.get<any>(`/user/login/${user2.id}`)
	token = data.token
	expect(typeof token).toBe("string")
})

test("se accedo con il token nei cookies non mi da errore", async () => {
	const { data: reuser2 } = await axiosIstance.get(
		`/user`,
		{ headers: { Authorization: `Bearer ${token}` } }
	)
	expect(reuser2).toEqual(expect.objectContaining(user2))
})