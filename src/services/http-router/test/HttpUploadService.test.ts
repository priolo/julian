import axios, { AxiosInstance } from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url'
import { PathFinder } from "../../../core/path/PathFinder.js"
import { RootService } from "../../../core/RootService.js"
import { getFreePort } from "../../ws/index.js"
import { HttpUploadService } from "../upload/HttpUploadService.js"



const __dirname = path.dirname(fileURLToPath(import.meta.url));

let PORT: number
let axiosIstance: AxiosInstance
const dirDest = path.join(__dirname, "./dest")
let root: RootService

beforeAll(async () => {
	PORT = await getFreePort()
	axiosIstance = axios.create({ baseURL: `http://localhost:${PORT}`, withCredentials: true });

	root = await RootService.Start({
		class: "http",
		port: PORT,
		children: [
			{
				class: "http-router/upload",
				path: "/upload",
				baseDir: dirDest,
				onGetDest: (req, file) => req.body.dest,
			},
			{
				class: "http-router/upload",
				path: "/upload_limit",
				baseDir: dirDest,
				maxBaseDirSize: 30,
				onGetDest: (req, file) => req.body.dest,
			},
			{
				class: "http-router",
				path: "/sub",
				children: [
					{
						class: "http-router/upload",
						path: "/upload",
						baseDir: dirDest,
						onGetDest: (req, file) => "./subroute/file.txt",
						// possibilità di sovrascrivere e usare la request
						// onRequest: (req, res, next) => {
						// 	const { email } = req.body
						// 	console.log(req.data)
						// 	res.sendStatus(200)
						// }
					},
				]
			}
		]
	})
})

beforeEach(async () => {
	// remove and recreate dir destination
	if (fs.existsSync(dirDest)) fs.rmdirSync(dirDest, { recursive: true })
	expect(fs.existsSync(dirDest)).toBeFalsy()
})

afterAll(async () => {
	await RootService.Stop(root)
})



test("su creazione", async () => {
	const test = new PathFinder(root).getNode<HttpUploadService>("/http/route-upload")
	expect(test).toBeInstanceOf(HttpUploadService)
})

test("upload multiple files (no limit)", async () => {

	const fileSurce1 = 'test_res/file1.json'
	const fileDest1 = path.join(dirDest, "./file1.json")
	const fileSurce2 = 'test_res/file2.json'
	const fileDest2 = path.join(dirDest, "./file2.json")

	const form = new FormData();
	form.append("file1", fs.createReadStream(fileSurce1));
	form.append("file2", fs.createReadStream(fileSurce2));
	const { data } = await axiosIstance.post(`/upload`, form, { headers: form.getHeaders() })

	expect(fs.existsSync(fileDest1)).toBeTruthy()
	expect(fs.existsSync(fileDest2)).toBeTruthy()
})

test("upload file with path", async () => {

	const fileSource = "test_res/file1.json"
	const fileDestRelative = path.join("./subdir", "./file1.json")
	const fileDestAbsolute = path.join(__dirname, "./dest", fileDestRelative)
	expect(fs.existsSync(fileDestAbsolute)).toBeFalsy()

	const form = new FormData();
	// deve stare prima del file altrimenti fallisce!
	form.append("dest", fileDestRelative)
	form.append("file1", fs.createReadStream(fileSource));
	const { data } = await axiosIstance.post(`/upload`, form, { headers: form.getHeaders() })

	expect(fs.existsSync(fileDestAbsolute)).toBeTruthy()
})

test("upload file in sub-router", async () => {

	const fileSource = "test_res/file1.json"
	const fileDestAbsolute = path.join(__dirname, "./dest", "./subroute/file.txt")
	expect(fs.existsSync(fileDestAbsolute)).toBeFalsy()

	const form = new FormData();
	form.append("file1", fs.createReadStream(fileSource));
	const { data } = await axiosIstance.post(`/sub/upload`, form, { headers: form.getHeaders() })

	expect(fs.existsSync(fileDestAbsolute)).toBeTruthy()
})


test("upload multiple files with limit", async () => {

	const fileSurce1 = 'test_res/file1.json'
	const fileDest1 = path.join(dirDest, "./file1.json")
	const fileSurce2 = 'test_res/file2.json'
	const fileDest2 = path.join(dirDest, "./file2.json")

	const form = new FormData();
	form.append("file1", fs.createReadStream(fileSurce1));
	form.append("file2", fs.createReadStream(fileSurce2));
	const { data } = await axiosIstance.post(`/upload_limit`, form, { headers: form.getHeaders() })

	expect(fs.existsSync(fileDest1)).toBeFalsy()
	expect(fs.existsSync(fileDest2)).toBeTruthy()
})