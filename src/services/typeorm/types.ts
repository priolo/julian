
/**
 * ACTION base typeorm
 */
export enum Actions {
	/**
	 * Ricerca con una query typeorm
	 * https://typeorm.io/docs/working-with-entity-manager/find-options
	 * ```
	 * payload: FindManyOptions<T> // criterio di ricerca (la clausola WHERE)
	 * ```
	 * returns: T[]
	 */
	FIND = "find",
	FIND_ONE = "find-one",
	FIND_AND_COUNT = "find-and-count",

	ALL = "all",
	GET_BY_ID = "getById",
	/**
	 * CREATE/UPDATE un entity
	 * https://typeorm.io/docs/working-with-entity-manager/repository-api
	 * ```
	 * payload: Partial<entity> | Partial<entity>[]
	 * ```
	 */
	SAVE = "save",
	/**
	 * Aggiorna sulla base di una selection  
	 * https://typeorm.io/docs/working-with-entity-manager/repository-api/  
	 * ```
	 * payload: { 
	 *    criteria: FindOptionsWhere<T> | FindOptionsWhere<T>[], 
	 *    partialEntity: QueryDeepPartialEntity<T> 
	 * }
	 * ```
	 */
	UPDATE = "update",
	DELETE = "delete",

	/**
	 * https://orkhan.gitbook.io/typeorm/docs/transactions#using-queryrunner-to-create-and-control-state-of-single-database-connection
	 * [II] Not work because not refer to same repository operations
	 */
	TRANSACTION_START = "transaction-start",
	TRANSACTION_END = "transaction-end",
	TRANSACTION_ROLLBACK = "transaction-rollback"
}

/**
 * ACTION for services REPO-BASE
 */
export enum RepoStructActions {
	/** permette di specificare un array di action dirette al repository */
	SEED = "seed",
	/** cancella i dati di una tabella disattivando le foregn keys */
	TRUNCATE = "truncate",
	/** cancella i dati di una tabella */
	CLEAR = "clear"
}

/**
 * @deprecated
 * 
 * ACTIONS for services REPO-REST
 * which that are do to a "IRepoRestDispatch"
 * 
 * Use Actions instead
 */
export enum RepoRestActions {
	ALL = "all",
	GET_BY_ID = "getById",
	SAVE = "save",
	DELETE = "delete"
}

/**
 * ACTIONS per oggetti REPO-TREE
 */
export enum RepoTreeActions {
	GET_CHILDREN = "get-children",
	GET_ROOTS = "get-roots"
}



/**
 * identifica un set di DISPATCH per un oggetto REPO
 * per esempio "TypeormRepoBaseService"
 */
export interface IRepoStructActions<T> {
	[RepoStructActions.SEED]: (values: T[]) => Promise<any[]>;
}

/**
 * identifica un set di DISPATCH per un oggetto REST
 * adatto all'oggetto "TypeormRepoService"
 */
export interface IRepoRestDispatch<T> {
	[Actions.ALL]: () => Promise<T[]>;

	[Actions.GET_BY_ID]: (id: string | number) => Promise<T>;

	[Actions.SAVE]: (entity: any) => Promise<T>;

	[Actions.DELETE]: (id: string | number) => Promise<any>;
}
