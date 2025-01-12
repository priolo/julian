
## HttpService

Node -> NodeState -> NodeConf -> ServiceBase -> HttpService

Permette di creare un **server http**
nei sui `children` contiene tipicamenti nodi `HttpRouterService`
dove è possibile implementare, per esempio, delle API REST.


## CONFIGURAZIONE

```typescript
type HttpServiceConf = { 
	// nome del NODE di default
	name: "http",
	/** il nome della CLASSE */
	class: "http",
	/**  la porta su cui il server rimane in scolto */
	port: 5000,
	/** il render da utilizzare per il momento c'e' solo "handlebars"  */
	render: <any>null,
	/** 
	 * opzioni di express:  
	 * @link https://expressjs.com/en/4x/api.html#app.set
	 */
	options: <{ [key: string]: any }>null,
	/** 
	 * se valorizzato creo un server `https`
	@example
	https: {
		// file del certificato pubblico
		privkey: "privkey.pem",
		// file della chiave privata
		pubcert: "pubcert.pem",
	}
	@link https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener
	*/
	https: <ServerOptionsCustom>null,
}
```

## ACTIONS

`nothing`


## EXAMPLE

```typescript
import { RootService } from "typexpress";

await RootService.Start([
	{
		class: "http",
		port: PORT,
		children: [
			{
				class: "http-router",
				routers: [
					{ method: (req, res, next) => res.send("HELLO WORLD") }
				],
			},
		]
	}
])
```
