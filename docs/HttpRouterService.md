
## HttpRouterService

`Node -> NodeState -> NodeConf -> ServiceBase -> HttpRouterServiceBase`

Generalmente figlio di un HttpServices
Mappa una richiesta HTTP REST con le funzioni della classe
Puo' essere annidato in altri RIUTERS per creare un albero di servizi REST

## CONFIGURAZIONE

```typescript
type HttpRouterServiceConf = { 
	/** nome del NODE di default */
	name: "router",
	/** se true gestisce gli errori */
	handleErrors: true,
	/** 
	 * lista di servizi REST per questo ROUTE 
	 **/
	routers: <IRouteParam[]>[]
}
```

```typescript
/**
 * Definisce un ROUTER
 */
type IRouteParam = {
	/** 
	 * path del ROUTER 
	 * */
	path?: string,
	/** 
	 * verbo HTTP 
	 * */
	verb?: string, //"get" | "post" | "update" | "delete",
	/** 
	 * metodo da chiamare quando invocato dal CLIENT
	 * */
	method: string | IRouteMethod,
}

/** 
 * funzione chiamata quando il ROUTER viene invocato dal CLIENT
 **/
type IRouteMethod = (req: Request, res: Response, next: any) => any
```

## ACTIONS

`nothing`


## EXAMPLE

```typescript
import { RootService } from "typexpress";

 await RootService.Start(
	{
		class: "http",
		port: PORT,
		children: [
			{
				name: "test",
				class: TestRoute,
				path: "/admin",
				routers: [
					{ path: "/user", verb: "get", method: (req, res, next) => res.json({ response: "user-ok" }) }
				]
			},
			{
				name: "test4",
				class: "http-router",
				path: "/async",
				routers: [
					{ method: async (req, res, next) => {
						await new Promise((rs, rj) => setTimeout(rs, 300))
						res.json({ response: "async" })
					}},
				],
			},
			{
				class: "http-router",
				path: "/sub",
				children: [
					{
						name: "test1",
						class: TestRoute,
						path: "/route1",
					},
					{
						name: "test2",
						class: TestRoute,
						path: "/route2",
					},
					{
						name: "test3",
						class: "http-router",
						path: "/route3",
						headers: { "accept": "json" },
						routers: [
							{ path: "/test", verb: "get", method: (req, res, next) => res.json({ response: "with_header" }) },
						]
					},
					{
						name: "test4",
						class: "http-router",
						path: "/route3",
						routers: [
							{ path: "/test", verb: "get", method: (req, res, next) => res.json({ response: "without_header" }) },
						]
					},
				]
			},
			{
				name: "testError",
				class: "http-router",
				path: "/error",
				routers: [
					{
						path: "/throw1", verb: "get", method: (req, res, next) => {
							throw new Error("test:error1")
						}
					},
					{
						path: "/throw2", verb: "get", method: (req, res, next) => {
							next(new error.ErrorNotify("test:error2"))
						}
					},
					{
						path: "/throw3", verb: "get", method: (req, res, next) => {
							throw "test:error3"
						}
					},
				]
			},
		]
	}
)
```
