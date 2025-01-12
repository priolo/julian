import axios, { AxiosInstance } from "axios"
import { Request, Response } from "express"
import { getFreePort } from "../../ws/index.js"
import { PathFinder, RootService, error, httpRouter, http, ConfActions } from "../../../index.js"

const { Service: HttpRouterService } = httpRouter
const { Service: HttpService } = http

describe("Server HTTP e i suoi ROUTER", () => {

	let PORT: number
	let axiosIstance: AxiosInstance
	let root: RootService

	/**
	 * Implementazione di un SERVICE `HttpRouterService`
	 */
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

	/**
	 * Creazione dei NODES per il test
	 */
	beforeAll(async () => {
		PORT = await getFreePort()
		axiosIstance = axios.create({
			baseURL: `http://localhost:${4599}`,
			withCredentials: true
		})

		root = await RootService.Start(
			{
				class: "http",
				port: PORT,
				children: [
					{
						name: "test",
						class: TestRoute,
						path: "/admin",
						routers: [
							{
								path: "/user/:id", verb: "get", method: (req, res, next) => {
									res.json({ response: "user-ok", id: req.params.id })
								}
							}
						]
					},
					{
						name: "test4",
						class: "http-router",
						path: "/async",
						routers: [
							{
								path: "/", verb: "get", method: async (req, res, next) => {
									await new Promise((rs, rj) => setTimeout(rs, 300))
									res.json({ response: "async" })
								}
							},
						],
					},
					{
						class: "http-router",
						path: "/sub",
						children: [
							{
								name: "test1",
								class: TestRoute,
								path: "/route1",
							},
							{
								name: "test2",
								class: TestRoute,
								path: "/route2",
							},
							{
								name: "test3",
								class: "http-router",
								path: "/route3",
								headers: { "accept": "json" },
								routers: [
									{ path: "/test", verb: "get", method: (req, res, next) => res.json({ response: "with_header" }) },
								]
							},
							{
								name: "test4",
								class: "http-router",
								path: "/route3",
								routers: [
									{ path: "/test", verb: "get", method: (req, res, next) => res.json({ response: "without_header" }) },
								]
							},
						]
					},
					{
						name: "testError",
						class: "http-router",
						path: "/error",
						routers: [
							{
								path: "/throw1", verb: "get", method: (req, res, next) => {
									throw new Error("test:error1")
								}
							},
							{
								path: "/throw2", verb: "get", method: (req, res, next) => {
									next(new error.ErrorNotify("test:error2"))
								}
							},
							{
								path: "/throw3", verb: "get", method: (req, res, next) => {
									throw "test:error3"
								}
							},
						]
					},
				]
			}
		)
	})

	afterAll(async () => {
		await RootService.Stop(root)
	})

	describe("senza NodeRoot", () => {

		test("evvai", async () => {

			const http = new HttpService("http", {
				port: 4599,
			})
			const route = new HttpRouterService("route", {
				routers: [{
					path: "/test",
					verb: "get",
					method: (req, res, next) => res.json({ response: "test-ok" })
				}]
			})
			http.addChild(route)
			await http.execute({ type: ConfActions.INIT })

			const { data } = await axiosIstance.get(`/test`)
			expect(data).toEqual({ response: "test-ok" })
		})
	})

	test("su creazione", async () => {
		/**
		 * Quindi come CHILD di un `HttpService` (o qualunque SERVICE che implementa `IHttpRouter`)
		 * posso implementare e inserire `HttpRouterService` 
		 */
		const test = new PathFinder(root).getNode<TestRoute>("/http/test")
		expect(test instanceof TestRoute).toBeTruthy()
	})

	test("request on route", async () => {
		/**
		 * Una volta inserita la classe derivata da `HttpRouterService` nel `HttpService`
		 * posso chiamare la sua rotta (la proprietà `path` concatenata seguendo l'albero dei NODES)
		 * e ottenere una risposta.
		 * Nella classe `TestRoute` verrà chiamata la funzione opportunamente mappata in `defaultConfig`
		 * notare che se non si specifica `path` viene usato il valore "/"
		 * e se non si specifica `verb` viene usato il valore "get"
		 */
		const { data } = await axiosIstance.get(`/admin/user/34`)
		expect(data).toEqual({ response: "user-ok", id: "34" })
	})

	test("request on subroute", async () => {
		const { data: d2 } = await axiosIstance.get(`/sub/route2/test`)
		expect(d2).toEqual({ response: "test-ok" })
	})

	test("request on subroute with header", async () => {
		let res = await axiosIstance.get(`/sub/route3/test`)
		expect(res.data).toEqual({ response: "with_header" })

		res = await axiosIstance.get(
			`/sub/route3/test`,
			{
				headers: {
					"accept": ''
				}
			}
		)
		expect(res.data).toEqual({ response: "without_header" })
	})

	test("request async", async () => {
		const { data: d2 } = await axiosIstance.get(`/async`)
		expect(d2).toEqual({ response: "async" })
	})

	/**
	### handleErrors:bool = true
	Se true gestisce automaticamente gli errori all'interno del "router"
	Cioe' se c'e' il lancio di un errore questo viene spedito a "ErrorService" piu' vicino. 
	> Notare che il server, in questa maniera, non si ferma su un eccezione 
	cosa che accadrebbe con `handleErrors = false`
	perche' gli errori dovrebbero essere gestiti interamente all'interno del router.
	> NOTA: con Express5 questa gestione è automatica quindi sarebbe SEMPRE gestita automaticamente cnhe con "false"
	 */
	test("gestione degli errori", async () => {
		let error

		try {
			await axiosIstance.get<any>(`/error/throw1`)
		} catch (err) {
			error = err
		}
		expect(error.response.status).toBe(500)

		try {
			await axiosIstance.get<any>(`/error/throw2`)
		} catch (err) {
			error = err
		}
		expect(error.response.status).toBe(500)

		try {
			await axiosIstance.get<any>(`/error/throw3`)
		} catch (err) {
			error = err
		}
		expect(error.response.status).toBe(500)
		//console.log(results)
	})

})