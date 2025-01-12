import { Bus } from "../../../core/path/Bus.js"
import { RepoRestActions } from "../../typeorm/types.js"
import { HttpRouterServiceConf } from "../HttpRouterService.js"
import { HttpRouterRestServiceBase } from "./HttpRouterRestServiceBase.js"



// export interface HttpRouterRestRepoServiceConf extends HttpRouterServiceConf {
//     /** la mode-path del NODE-REPOSITORY da utilizzare  */
//     repository: string
// }

export type HttpRouterRestRepoServiceConf = Partial<HttpRouterRestRepoService['stateDefault']> & { class: "http-router/repo", children?: HttpRouterServiceConf[] }


/**
 * Collega un ROUTE con un REPO 
 * ed espone dei metodi per il REST
 */
export class HttpRouterRestRepoService extends HttpRouterRestServiceBase {

    get stateDefault() {
        return {
            ...super.stateDefault,
            /** nome del NODE di default */
            name: "route-rest-repo",
            /** la path al NODE che contiene il REPOSITORY */
            repository: "",
        }
    }

    protected async getAll(): Promise<any[]> {
        const { repository } = this.state
        return await new Bus(this, repository).dispatch({
            type: RepoRestActions.ALL
        })
    }

    protected async getById(id: string): Promise<any> {
        const { repository } = this.state
        return await new Bus(this, repository).dispatch({
            type: RepoRestActions.GET_BY_ID,
            payload: id
        })
    }

    protected async save(entity: any): Promise<any> {
        const { repository } = this.state
        return await new Bus(this, repository).dispatch({
            type: RepoRestActions.SAVE,
            payload: entity
        })
    }

    protected async delete(id: string): Promise<any> {
        const { repository } = this.state
        return await new Bus(this, repository).dispatch({
            type: RepoRestActions.DELETE,
            payload: id
        })
    }
}