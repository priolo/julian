import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';
import { RootService } from "../../../core/RootService.js";
import { getFreePort } from "../../ws/index.js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

let root: RootService
let res: any
let PORT: number

beforeAll(async () => {
	PORT = await getFreePort()
	root = await RootService.Start(
		{
			class: "http",
			port: PORT,
			children: [
				{
					class: "http-static",
					dir: path.join(__dirname, "../test"),	// directory locale che contiene i file
					path: "/public",
				},
				{
					class: "http-static",
					dir: path.join(__dirname, "../test"),	// directory locale che contiene i file
					path: "/spa",
					spaFile: "text.js",
				}
			]
		}
	)
})

afterAll(async () => {
	await RootService.Stop(root)
})

test("accesso a PUBLIC", async () => {
	res = await axios.get(`http://localhost:${PORT}/public/text.js`)
	expect(res.data).toContain<string>('let _test = "pippo"')
})

test("accesso a SPA con url inesistente", async () => {
	res = await axios.get(`http://localhost:${PORT}/spa/not/exist/url/spa.spa`)
	expect(res.data).toContain<string>('let _test = "pippo"')
})

test("url inesistente in PUBLIC da errore", async () => {
	try {
		res = await axios.get(`http://localhost:${PORT}/public/not/exist/url/spa.spa`)
	} catch (e) {
		res = e
	}
	expect(res.response.status).toBe(404)
})