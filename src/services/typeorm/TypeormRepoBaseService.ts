import { Between, DataSource, Raw, Repository } from "typeorm";
import { ServiceBase } from "../../core/ServiceBase.js";
import { IRepoStructActions, RepoStructActions } from "./types.js";
import { TypeormService } from "./TypeormService.js";
import { Actions } from "./utils.js";



/**
 * [ABSTRACT] Rappresente un REPO di uno specifico MODEL
 * di TYPEORM
https://typeorm.io/#/separating-entity-definition
https://typeorm.delightful.studio/interfaces/_entity_schema_entityschemarelationoptions_.entityschemarelationoptions.html#cascade
 */
export abstract class TypeormRepoBaseService extends ServiceBase {

	get stateDefault(): any {
		return {
			...super.stateDefault,
			model: null, // string:mandatory:MODEL di riferimento per questo REPO
			seeds: null, // indica le action da fare su questo REPO,
		}
	}

	get executablesMap(): any {
		return <IRepoStructActions<any>>{
			...super.executablesMap,
			[Actions.FIND]: async (query: any) => await this.find(query),
			[Actions.FIND_ONE]: async (query: any) => await this.findOne(query),
			[RepoStructActions.SEED]: async (seeds) => await this.seed(seeds ?? this.state.seeds),
			[RepoStructActions.TRUNCATE]: async () => await this.truncate(),
			[RepoStructActions.CLEAR]: async () => await this.clear(),

			[Actions.TRANSACTION_START]: async () => await this.transactionStart(),
			[Actions.TRANSACTION_END]: async () => await this.transactionEnd(),
		}
	}

	/**
	 * Restituisce la "Connection" nativa typeorm prelevandola dal parent
	 */
	protected get connection(): DataSource {
		const ts = this.nodeByPath<TypeormService>("..")
		return ts.connection
	}

	/**
	 * restituisce il name del model 
	 */
	protected get model(): any {
		const { model } = this.state
		return typeof model == "object" ? model?.name : model
	}

	//private repo:Repository<unknown> = null

	/**
	 * Restituiesce il "Repository" nativo typeorm di questo nodo
	 * [II] gestire errori... per esempio qua c'e' un errore se il repository non esiste
	 */
	protected getRepo(model?: string): Repository<unknown> {
		const repo = this.connection.getRepository(model ?? this.model)
		return repo
	}

	// [II] da implementare
	private transactionStart() {
		const repo = this.getRepo()
		return repo.queryRunner.startTransaction()
	}
	private transactionEnd() {
		const repo = this.getRepo()
		return repo.queryRunner.commitTransaction()
	}

	/**
	 * Effettua una ricerca su questo REPO
	 * @param query 
	 * @returns 
	 */
	private async find(query: any): Promise<any[]> {
		const repo = this.getRepo()
		return await repo.find(this.normalizeQuery(query))
	}

	private async findOne(query: any): Promise<any> {
		const repo = this.getRepo()
		return await repo.findOne(this.normalizeQuery(query))
	}

	private normalizeQuery(query: any): any {
		if (query.where) {
			// permette di poter utilizzare le "Advanced Options"
			// https://typeorm.io/find-options#advanced-options
			Object.keys(query.where).forEach(key => {
				const value = query.where[key]
				const { type } = value
				if (!type) return
				switch (type) {
					case "raw":
						const { sql } = value
						query.where[key] = Raw(alias => sql?.replace("{*}", alias))
						break
					case "between":
						const { from, to } = value
						query.where[key] = Between(from, to)
						break
				}
			})
		}
		return query
	}

	/**
	 * Inserisce dei record in questo REPO
	 * @param seeds 
	 * @returns 
	 */
	private async seed(seeds: Array<any>): Promise<void> {
		if (!Array.isArray(seeds)) return
		const repo = this.getRepo()

		for (const seed of seeds) {

			// is a string maybe SQL?
			if (typeof seed == "string") {
				await repo.query(seed)
				continue
			}

			// is a Action ti dispatch
			// { type: RepoStructActions.TRUNCATE }, 
			if (seed.type) {
				await this.execute(seed)
				continue
			}

			// is object... maybe Entity?
			await repo.save(seed)
		}
	}

	/**cancella i dati di una tabella disattivando le foregn keys */
	private async truncate(): Promise<void> {
		const repo = this.getRepo()
		const qr = this.connection.createQueryRunner()
		await this.connection.query('PRAGMA foreign_keys=OFF');
		await qr.clearTable(repo.metadata.tableName)
		await this.connection.query('PRAGMA foreign_keys=ON');
	}

	/**cancella i dati di una tabella */
	private async clear(): Promise<void> {
		const repo = this.getRepo()
		//await this.connection.query('PRAGMA foreign_keys=OFF');
		await repo.query(`DELETE FROM ${repo.metadata.tableName};`);
		//await this.connection.query('PRAGMA foreign_keys=ON');
	}

}