import { log, LOG_TYPE } from "@priolo/jon-utils"
import express, { Router } from "express"
import fs from "fs"
import p from "path"
import serveIndex from "serve-index"
import { fileURLToPath } from 'url'
import { HttpRouterServiceBase } from "../../services/http-router/HttpRouterServiceBase.js"



const __dirname = p.dirname(fileURLToPath(import.meta.url));

export type HttpStaticServiceConf = Partial<HttpStaticService['stateDefault']> & { class: "http-static" }

/**
 * Crea un ROUTE che punta ad una directory
 * la directory è un entry-point STATICO per le richiete http
 */
export class HttpStaticService extends HttpRouterServiceBase {

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "http-static",
			path: "/public",
			dir: p.join(__dirname, "../static"),	// directory locale che contiene i file
			spaFile: null, //"index.html",
			index: false,
			options: {
				dotfiles: "ignore", 			// ignora i file che iniziano con il punto. allow | deny | ignore
				etag: false,					// Abilita o disabilita la generazione di etag				
				extensions: ["htm", "html"],	// le estensioni da usare nel caso in cui il file non viene trovato				
				fallthrough: true, 				// (true) ignora gli errori di file non trovati
				immutable: false, 				// (true) dichiara i file imutabili quindi disabilita maxAge
				lastModified: true,				// Set the Last-Modified header to the last modified date of the file on the OS.
				maxAge: "1d",					// Set the max-age property of the Cache-Control header in milliseconds or a string in ms format.
				redirect: true,					// Redirect to trailing “/” when the pathname is a directory.
				// setHeaders: (res, path, stat) => {
				//  	res.set("x-timestamp", Date.now().toString())
				// }
			}
		}
	}

	protected async onInit(): Promise<void> {
		const { dir, path } = this.state
		if (!fs.existsSync(dir)) {
			log(`Directory "${dir}" not found. I try to create it myself`, LOG_TYPE.INFO)
			fs.mkdirSync(dir)
		}
		await super.onInit()
		log(`HttpStaticService:start:path:[${path}]>[${dir}]`, LOG_TYPE.INFO)
	}

	protected onBuildRouter(): Router {
		const router = super.onBuildRouter()
		const { dir, options, index, spaFile } = this.state

		router.use(express.static(dir, options))

		// abilito l'index
		if (index == true) {
			router.use(serveIndex(dir, { 'icons': true }))
		}

		// abilito la single page per un file specifico
		if (spaFile) {
			router.get('*', function (req, res) {
				res.sendFile(p.join(dir, spaFile))
			});
		}

		return router
	}

}