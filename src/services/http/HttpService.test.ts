import axios, { AxiosInstance } from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { http as httpNs, httpRouter, PathFinder, RootService } from "../../index.js";
import { getFreePort } from "../ws/utils.js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("HTTP SERVICE", () => {

	let PORT = 0
	let root: RootService
	let axiosIstance: AxiosInstance

	beforeAll(async () => {
		PORT = await getFreePort()
		axiosIstance = axios.create({ 
			baseURL: `http://localhost:${PORT}`, 
			withCredentials: true 
		})
	})
	afterAll(async () => {
		await RootService.Stop(root)
	})

	test("su creazione", async () => {

		/**
		 * Per creare un HttpService si puo' utilizzare il  "classico" name sul NODE
		 * per `HttpService` è `http`
		 */
		root = await RootService.Start(
			<httpNs.conf>{ class: "http", port: PORT }
		)

		// quindi qui ho il `RootService` con un solo `child` di tipo `http`
		// aperto su una porta libera.
		// infatti lo cerco e lo trovo
		const http = new PathFinder(root).getNode<httpNs.Service>("/http")
		expect(http instanceof httpNs.Service).toBeTruthy()
		expect(http.state.port).toBe(PORT)

		// quando chiudo il `RootService` anche il server si chiude (naturalmente)
		await RootService.Stop(root)

		// naturalmente un server del genere non serve a nulla 
		// se non si inseriscono dei `route` al suo interno
		// E' quello che fa `http-route`
	})

	test("example", async () => {

		await RootService.Start([
			<httpNs.conf>{
				class: "http",
				port: PORT,
				children: [
					<httpRouter.conf>{
						class: "http-router",
						routers: [
							{ method: (req, res, next) => res.send("HELLO WORLD") }
						],
					},
				]
			}
		])

		const response = await axiosIstance.get('/');

		expect(response.data).toEqual("HELLO WORLD")
	})

	test("handlebars", async () => {

		await RootService.Start([
			<httpNs.conf>{
				class: "http",
				port: PORT,  // Changed from 4500 to PORT
				render: { name: "handlebars" },
				options: { views: path.join(__dirname, "./views") },
				children: [
					<httpRouter.conf>{
						class: "http-router",
						path: "/",
						routers: [
							{
								path: "/", verb: "get", method: async function (req, res, next) {
									const items = [{ title: "title1" }, { title: "title2" }, { title: "title3" }]
									res.render("list", { items })
								}
							},
						],
					},
				]
			}
		])

		const response = await axiosIstance.get('/');

		expect(response.data)
			.toEqual("<body><div>Item: </div><div>Item: </div><div>Item: </div></body>")

	})

})