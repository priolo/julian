import { TypeormRepoBaseService } from "./TypeormRepoBaseService.js";
import { IRepoRestDispatch, RepoRestActions } from "./types.js";



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
			findOptions: null,
		}
	}

	get executablesMap(): any {
		return <IRepoRestDispatch<any>>{
			...super.executablesMap,
			[RepoRestActions.SAVE]: async (entity) => {
				const repo = this.getRepo()
				return await repo.save(entity);
			},
			[RepoRestActions.ALL]: async () => {
				const repo = this.getRepo()
				return await repo.find(this.state.findOptions);
			},
			[RepoRestActions.GET_BY_ID]: async (id) => {
				const repo = this.getRepo()
				return await repo.findOne({ where: { id } }) ?? null;
			},
			[RepoRestActions.DELETE]: async (id) => {
				const repo = this.getRepo()
				//await this.connection.query('PRAGMA foreign_keys=OFF');
				const ret = await repo.delete(id);
				//await this.connection.query('PRAGMA foreign_keys=ON');
				return ret
			},
		}
	}

}