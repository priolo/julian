import axios, { AxiosInstance } from "axios"
import fs from "fs"
import path from 'path'
import { fileURLToPath } from 'url'
import { RootService } from "../../../core/RootService.js"
import { Bus } from "../../../core/path/Bus.js"
import { getFreePort } from "../../ws/index.js"
import { jwt as jwtNs } from "../index.js"
import { RepoRestActions, RepoStructActions } from "../../typeorm/types.js"
import { Request, Response } from "express"



const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("Routing con JWT", () => {

	let PORT: number
	const dbPath = `${__dirname}/database.sqlite`
	let root: RootService
	let axiosIstance: AxiosInstance

	beforeAll(async () => {
		PORT = await getFreePort()
		axiosIstance = axios.create({ baseURL: `http://localhost:${PORT}`, withCredentials: true });

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
								// login con ID (è solo un esempio)
								path: "/login/:id", method: async (req: Request, res: Response) => {
									const userId = req.params.id

									// get user or any payload
									const user = await new Bus(root, "/typeorm/user").dispatch({
										type: RepoRestActions.GET_BY_ID,
										payload: userId,
									})

									// get service and put payload
									const jwtService = root.nodeByPath<jwtNs.Service>("/http/route-jwt")
									await jwtService!.putPayload(user, res)

									/*
									// other method witout get service:
									// create token
									const token = await new Bus(this, "/http/route-jwt").dispatch({
										type: RouteJWTUserActions.GENERATE_TOKEN,
										payload: user,
									})
									// metto il token nei cookie
									res.cookie('token', token, { maxAge: 900000, httpOnly: true })
									*/

									res.sendStatus(200)
								}
							}
						]
					},
					{
						class: "http-router/jwt",
						repository: "/typeorm/user",
						jwt: "/jwt",
						children: [
							{
								class: "http-router",
								path: "/user",
								routers: [
									{
										method: (req: Request, res: Response) => {
											res.json((<any>req)["jwtPayload"])
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
				},
				children: [
					{
						name: "user",
						class: "typeorm/repo",
						model: {
							name: "user",
							columns: {
								id: { type: Number, primary: true, generated: false },
								username: { type: String }
							}
						},
						seeds: [
							{ id: 1, username: "Ivano" },
							{ id: 2, username: "Marina" },
							{ id: 3, username: "Mattia" },
						]
					}
				],
			},
			{
				class: "jwt",
				secret: "secret_word!!!"
			},
		])

		await new Bus(root, "/typeorm/user").dispatch({ type: RepoStructActions.SEED })
	})

	afterAll(async () => {
		await RootService.Stop(root)
		try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath) } catch (e) { console.log(e) }
	})

	test("creation", async () => {
		const rjwt = root.nodeByPath<jwtNs.Service>("/http/route-jwt")
		expect(rjwt).toBeInstanceOf(jwtNs.Service)
	})

	// test("if I log in WITHOUT the token ... it should give me an error", async () => {
	// 	let err: any
	// 	try {
	// 		await axiosIstance.get(`/user`)
	// 	} catch (e) {
	// 		err = e
	// 	}
	// 	expect(err && err.response && err.response.status).toBe(401)
	// })

	// test("if I log in with the token in the cookies it doesn't give me an error", async () => {
	// 	// login
	// 	const resp = await axiosIstance.get(`/user/login/2`)
	// 	const setCookieHeader = resp.headers["set-cookie"];
	// 	if (!setCookieHeader) throw new Error("Set-Cookie header is missing in the response")
	// 	const [cookie] = setCookieHeader;
	// 	// get auth data
	// 	const { data } = await axiosIstance.get(`/user`, { headers: { Cookie: cookie } })
	// 	expect(data).toMatchObject({ id: 2, username: "Marina" })
	// })

})