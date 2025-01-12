import { log, LOG_TYPE } from "@priolo/jon-utils"
import { Request, Response, Router } from "express"
import fs from "fs"
import multer from 'multer'
import path from "path"
import { filesystem } from "@priolo/jon-utils"
import { HttpRouterServiceBase } from "../HttpRouterServiceBase.js"


/**
 * middleware 
 * inserische un entry-point http per salvare un file sul server
 * https://github.com/expressjs/multer
 */
export class HttpUploadService extends HttpRouterServiceBase {

    get stateDefault(): any {
        return {
            ...super.stateDefault,
            // <string> nome del service
            name: "route-upload",
            // path dove inserire i files
            baseDir: "/",
            /** 
             * hook: chiamato per ogni file, deve restituire la path dove inserire i file stesso
             * riceve come parametri la "request" e il [file](https://github.com/expressjs/multer#file-information)
             * restituisce una string della path da usare (che verra' poi concatenata alla "baseDir")
            **/
            onGetDest: null,
            /**
             * hook: chiamato quando c'e' una request
             * riceve i classici parametri di express (req, res, next)
             */
            onRequest: null,
            /**
             * "verb" da utilizzare nel route (insert!post|...)
             */
            verb: "post",
            /**
             * Massimo numero di file 
             */
            maxFileNumb: Number.POSITIVE_INFINITY,
            /**
             * Massima dimensione per ogni file
             * il valore è in bytes
             */
            maxFileSize: Number.POSITIVE_INFINITY,
            /**
             * Massima dimensione della directory che ospita i file
             * se supera le dimensioni massime vengono eliminati piu' vecchi
             * il valore è in bytes
             */
            maxBaseDirSize: Number.POSITIVE_INFINITY,

            // Comportamento da usare per gestire l'accumulo dei file nella directory
            onMenageSizeStrategy: RemoveOldFileStrategy,
        }
    }

    protected onBuildRouter(): Router {
        const router = super.onBuildRouter()
        const { baseDir, verb, maxFileSize, maxFileNumb } = this.state

        // creo lo "storage" di "multer"
        const storage = multer.diskStorage({

            // restituisce (tramite il callback "cb") la path della directory dove salvare i files
            destination: (req, file, cb) => {
                // valorizzo la "dirDest"
                const dirDest = path.join(baseDir, this.onGetDirName(req, file))
                // se la "dirDest" non esiste allora la creo
                // [II] non posso usare i promise perche' a quanto pare multer non è sincronizzato
                //await createDirIfNotExist(dirDest)
                if (!fs.existsSync(dirDest)) {
                    log(`Directory "${dirDest}" not found. I try to create it myself`, LOG_TYPE.INFO)
                    fs.mkdirSync(dirDest, { recursive: true })
                }
                // restituisco la "dirDest"
                cb(null, dirDest)
            },

            // restituisce (tramite callback "cb") il nome del file
            filename: (req, file, cb) => {
                // if (maxFileSize > 0 && file.size > maxFileSize) {
                //     cb(new Error("è tropppo pesante"), file.originalname)
                //     return
                // }
                const fileDest = this.onGetFileName(req, file)
                cb(null, fileDest)
            }
        })

        // istanza di "multer"
        const upload = multer({ 
            storage,
            limits: {
                fileSize: isNaN(maxFileSize) ? Number.POSITIVE_INFINITY : maxFileSize, 
                files: isNaN(maxFileNumb) ? Number.POSITIVE_INFINITY : maxFileNumb,
            } 
        })

        // creo il "router" e lo restituisco al server
        //router.post("/", upload.fields(fields), (req: Request, res: Response, next) => {
        router[verb]("/", upload.any(), async (req: Request, res: Response, next) => {
            await this.state.onMenageSizeStrategy(this.state)
            this.onRequest(req, res, next)
        })

        return router
    }

    /**
     * Restituisce una stringa che rappresenta la directory da usare per una specifica request/file
     * se la directory non esiste viene creata
     * la directory è relativa a "state.baseDir"
     * @param req 
     * @param file 
     * @returns 
     */
    protected onGetDirName(req: Request, file: Express.Multer.File): string {
        const { onGetDest } = this.state
        const dest = onGetDest?.bind(this)(req, file)
        const dir = dest ? path.parse(dest).dir : "."
        return dir
    }

    /**
     * Restituisce il nome del file da utilizzare
     * deve essere comprensivo di estensione
     * @param req 
     * @param file 
     * @returns 
     */
    protected onGetFileName(req: Request, file: Express.Multer.File): string {
        const { onGetDest } = this.state
        const dest = onGetDest?.bind(this)(req, file)
        const fileName = dest ? path.parse(dest).base : file.originalname
        //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        //cb(null, file.fieldname + '-' + uniqueSuffix)
        return fileName
    }

    /**
     * Chiamato quand' c'e' una "request" http
     * eventuali file sono gia' stati salvati sull'HD
     * @param req 
     * @param res 
     * @param next 
     */
    protected onRequest(req: Request, res: Response, next): void {
        const { onRequest } = this.state
        if (onRequest) {
            onRequest.bind(this)(req, res, next)
        } else {
            res.sendStatus(200)
        }
    }
}

/**
 * se la somma di tutti i file della dir è superiore al consentito
 * elimina i file piu' vecchi
 * @param state 
 */
 async function RemoveOldFileStrategy (state) {
    const { maxBaseDirSize, baseDir } = state
    if (isNaN(maxBaseDirSize) || maxBaseDirSize == Number.POSITIVE_INFINITY) return

    // controllo che la directory non sia troppo piena    
    const { size, fileOld } = await filesystem.getDirInfo(baseDir)
    if (size <= maxBaseDirSize) return

    // elimino il file piu' vecchio e ricontrollo
    const fileToDelete = path.join(baseDir, fileOld)
    await fs.promises.unlink(fileToDelete)
    await RemoveOldFileStrategy(state)
}