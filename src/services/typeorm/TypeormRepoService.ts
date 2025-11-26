import { FindManyOptions } from "typeorm";
import { TypeormRepoBaseService } from "./TypeormRepoBaseService.js";
import { Actions, IRepoRestDispatch, RepoRestActions } from "./types.js";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";



/**
 * Rappresente un REPO di uno specifico MODEL
 * di TYPEORM
 */
export class TypeormRepoService extends TypeormRepoBaseService {

	get stateDefault(): any {
		return {
			...super.stateDefault,
			// https://typeorm.io/#/find-options
			// opzione da usare in "ALL", Per esempio se il risultato deve comprendere anche delle relazioni:
			// findOptions: { relations: ["documents"] },
			findOptions: <FindManyOptions>null,
		}
	}

	get executablesMap(): any {
		return <IRepoRestDispatch<any>>{
			...super.executablesMap,
			[Actions.SAVE]: async (entity) => {
				const repo = this.getRepo()
				return await repo.save(entity);
			},
			[Actions.UPDATE]: async (payload: { criteria: any, partial: QueryDeepPartialEntity<any> }) => {
				const repo = this.getRepo()
				return await repo.update(payload.criteria, payload.partial);
			},
			[Actions.ALL]: async (payload: FindManyOptions) => {
				const repo = this.getRepo()
				return await repo.find(payload ?? this.state.findOptions);
			},
			[Actions.GET_BY_ID]: async (id) => {
				const repo = this.getRepo()
				return await repo.findOne({ where: { id } }) ?? null;
			},
			[Actions.DELETE]: async (id) => {
				const repo = this.getRepo()
				//await this.connection.query('PRAGMA foreign_keys=OFF');
				const ret = await repo.delete(id);
				//await this.connection.query('PRAGMA foreign_keys=ON');
				return ret
			},
		}
	}

}