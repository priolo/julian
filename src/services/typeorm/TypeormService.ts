import path from "path";
import { DataSource, DataSourceOptions, EntitySchema } from "typeorm";
import { EntitySchemaOptions } from "typeorm/browser";
import { ServiceBase } from "../../core/ServiceBase.js";
import { TypeormRepoBaseService } from "./TypeormRepoBaseService.js";
// import { TypeormRestService } from "./TypeormRestService.js";
// import { ConfActions } from "../../core/node/NodeConf.js";
import { fileURLToPath } from 'url';
import { TypeLog } from "../../core/types.js";

export type TypeormServiceConf = Partial<TypeormService['stateDefault']> & { class: "typeorm" }



const __dirname = path.dirname(fileURLToPath(import.meta.url));



/**
 * Crea e utilizza un DataSource Typeorm. 
 * E' il "node" padre di tutti i repo
 */
export class TypeormService extends ServiceBase {

	get stateDefault() {
		return {
			...super.stateDefault,
			name: "typeorm",
			// https://typeorm.io/data-source-options#common-data-source-options
			options: <DataSourceOptions>{
				type: "sqlite",
				//"username": null,
				//"password": null,
				database: path.join(__dirname, "../database/database.sqlite"),
				synchronize: true,
				logging: true,
				entities: [], // array-schema-entity-directory:mandatory:ex:[path.join(__dirname, "./models/**/*.js")]
				schemas: [],	// array-schema
				// "migrations": [
				// 	"./database/migration/**/*.js"
				// ],
				// "subscribers": [
				// 	"../../subscriber/**/*.js"
				// ],
				// "cli": {
				// 	"entitiesDir": "app/models",
				// 	"migrationsDir": "database/migration",
				// 	"subscribersDir": "app/subscriber"
				// }
			},
			schemas: <EntitySchemaOptions<any>[]>null,
		}
	}

	public get connection(): DataSource | null {
		return this._connection
	};
	private _connection: DataSource | null = null

	/**
	 * Dopo aver creato tutti i "children" li raccolgo per creare i "repo" in typeorm e connettermi al db
	 */
	protected async onInitAfter(): Promise<void> {
		let { options, schemas } = this.state

		if (!options) return this.log( "typeorm:options:obbligatory", null, TypeLog.ERROR)

		// // raccolgo tutti i children che derivano da typeorm-repo e che hanno un "model" cioe' una schema definition
		// const childRepo = this.children
		// 	.filter(c => c instanceof TypeormRepoBaseService && c?.state?.model && typeof c.state.model == "object")

		// raccolgo tutti gli SCHEMA presenti in STATE e nei CHILDREN
		const entities = [
			...schemas?.map(s => new EntitySchema(s)) ?? [],
			...this.children
				?.map(c => {
					if (!(c instanceof TypeormRepoBaseService) || !(c?.state?.model)) return null
					return typeof c.state.model == "object" ? new EntitySchema(c.state.model) : c.state.model
				})
				?.filter(c => !!c) ?? []
		]

		// creo gli oggetti EntitySchema che dovro' passare a typeorm
		if (entities.length > 0) {
			options.entities = [
				...options.entities ?? [],
				...entities
			]
		}

		// creo la connessione
		this.setState({ options })

		try {
			const ds = new DataSource(options)
			this._connection = await ds.initialize()
		} catch (error) {
			this.log( "typeorm:initialize", error, TypeLog.ERROR)
		}

		await super.onInitAfter()
	}

	/**
	 * Quando il nodo viene distrutto chiudo la connesione
	 */
	protected async onDestroy(): Promise<void> {
		await this._connection?.close()
		this._connection = null
	}

}