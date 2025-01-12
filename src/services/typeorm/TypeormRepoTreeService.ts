import { TreeRepository } from "typeorm";
import { RepoTreeActions } from "./types.js";
import { TypeormRepoService } from "./TypeormRepoService.js";




/**
 * Rappresente un REPO di uno specifico MODEL
 * di TYPEORM
 * https://typeorm.io/#/tree-entities/working-with-tree-entities
 */
export class TypeormRepoTreeService extends TypeormRepoService {

	get executablesMap(): any {
		return {
			...super.executablesMap,
			[RepoTreeActions.GET_CHILDREN]: async (entity: any) => {
				const repo = this.getTree().findDescendantsTree(entity)
				return await repo
			},
			[RepoTreeActions.GET_ROOTS]: async () => {
				const repo = this.getTree().findRoots()
				return await repo
			},
		}
	}

	/**
	 * Restituiesce il "Repository" nativo typeorm di questo nodo
	 * @param model 
	 * @returns 
	 */
	protected getTree(model?: string): TreeRepository<unknown> {
		const repo = this.connection.getTreeRepository(model ?? this.model)
		return repo
	}

}