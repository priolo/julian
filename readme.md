# TYPEXPRESS

![Bob](./img/logo.png)

## DESCRIPTION

Inizialmente dovevo creare un semplice microservizio in Express
Durante lo sviluppo mi sono reso conto che per ogni opzione aggiunta (JWT, DB, Render engine...)
dovevo studiare diversi approcci.
Alla fine ho sviluppato un livello che nasconde tutta la complessità


## INSTALLATION

istalla "typexpress" nel progetto  
`npm i typexpress`


## QUICK START FAQ STYLE

### Voglio un semplice SERVER HTTP  
*[Bob]:* ...diciamo con un route `/myroute`?

[sandbox](https://codesandbox.io/s/http-router-1-z203w?file=/src/index.js)

```js
const {RootService} = require("typexpress")

RootService.Start({
	class: "http",
	port: 8080,
	children: [
		{
			class: "http-router",
			path: "/myroute",
			routers: [{
				verb: "get",
				method: (req, res, next) => {
					res.json({response: "hello world"})
				}
			}]
		},
	]
})
```
> **ATTENZIONE!** la funziona lambda va bene se non si usa il `this`!   
> Se devi usare il `this` usa `function`:  
```js
method: function (req, res, next) {
	...
}
```

https://z203w.sse.codesandbox.io/myroute

---

### No aspetta! Voglio un SERVER HTTP STATICO  
che punta alla cartella: `/public_static`  
e con la rotta: `/pub`  

[sandbox](https://codesandbox.io/s/http-static-1-sj9bz?file=/src/index.js)

```js
const {RootService} = require("typexpress")
const path = require("path")

RootService.Start([
	{
		class: "http",
		port: 8080,
		children: [
			{
				class: "http-static",
				// local directory in file-system
				dir: path.join(__dirname, "../public_static"),
				// path of routing
				path: "/pub"
			}
		]
	}
])
```

https://sj9bz.sse.codesandbox.io/

---

### ... e con visualizzazione della DIRECTORY nella rotta `/index`

[sandbox](https://codesandbox.io/s/http-static-index-682xm?file=/src/index.js)

https://682xm.sse.codesandbox.io/index

---

### Ma mettiamo che VOGLIO MANDARE INFORMAZIONI
con una form html nella cartella static

[sandbox](https://codesandbox.io/s/http-form-1-cc08y?file=/src/index.js)

```js
const {RootService} = require("typexpress")
const path = require("path")

RootService.Start([
	{
		class: "http",
		port: 8080,
		children: [
			{
				class: "http-static",
				dir: path.join(__dirname, "../public"),
				path: "/"
			},
			{
				class: "http-router",
				path: "/greet",
				routers: [{
					verb: "post",
					method: async (req, res, next) => {
						res.send(`<p>Hallo ${req.body.name}!</p>`)
					}
				}]
			},
			
		]
	}
])
```

https://cc08y.sse.codesandbox.io/

---

BELLO... ma, andiamo, non posso creare pagine HTML cosi !!!   
### Mi serve un... TEMPLATE ENGINE
*[Bob]:* Ok ok automaticamente c'e' il supporto a [handlebars](https://github.com/express-handlebars/express-handlebars)  
*(supporto da migliorare ed estendere)*

[sandbox](https://codesandbox.io/s/http-form-handlebars-z2o31?file=/src/index.js:130-153)

---

### Aspetta! Aspetta! Ma io di solito faccio app in REACT con CRA!
*[Bob]:* allora puoi creare un entrypoint per SPA

[sandbox](https://codesandbox.io/s/http-static-spa-tbq4l)

```js
const {RootService} = require("typexpress")
const path = require("path")

RootService.Start({
	class: "http",
	port: 8080,
	children: [
		{
			class: "http-static",
			dir: path.join(__dirname, "../build"),
			path: "/",		// ATTENZIONE: definire un path necessita una "base dir" nel client!
			spaFile: "index.html",
		}
	]
})
```

https://tbq4l.sse.codesandbox.io

---

### Si vabbe' pero' i DATI poi dove li metto? Il DB dov'è???
*[Bob]:* Mbeh usi [Typeorm](https://typeorm.io/#/) e li metti... che ne so... facciamo sqlite!?  
Guarda, prendi sto ToDo e divertiti

[sandbox](https://codesandbox.io/s/typeorm-yith3?file=/src/index.js)  
https://yith3.sse.codesandbox.io/

```js
RootService.Start([
	
	// Server HTTP
	{ ... },
		
	// SERVICE del DB
	{
		// istanzia un SQLITE
		class: "typeorm",
		options: {
			type: "sqlite",
			database: path.join(__dirname, "../db/database.sqlite"),
			synchronize: true
		},
		// i REPOSITORY del DB
		children: [
			{
				name: "todo", class: "typeorm/repo",
				model: {
					name: "Todo",
					// https://typeorm.io/#/separating-entity-definition
					columns: {
						id: {type: Number, primary: true, generated: true},
						title: {type: String, default: ""},
					}
				}
			}
		]
	}
])
```
> Puoi anche usare `http-route/rest`  
> ti permette di collegare un elemento REST al DB in un colpo solo

```js
root = await RootService.Start([
	// SERVER HTTP
	{
		class: "http",
		port: PORT,
		children: [
			// REST HTTP on USER REPOSITORY
			{
				name: "user",
				path: "/user",
				class: "http-router/repo",
				repository: "/typeorm/user",
			}
		]
	},
	// DB
	{
		class: "typeorm",
		options: {
			"type": "sqlite",
			"database": dbPath,
			"synchronize": true,
			"entities": [User],
		},
		children: [
			{ name: "user", class: "typeorm/repo", model: "User" },
		]
	}
])
```
 
> in NodeJS ci sono due librerie principali per l'ORM
> - [Sequelize](https://sequelize.org/)
> - [Typeorm](https://typeorm.io/)  
> 
> Per il momento c'e' solo il supporto a Typeorm (il nome "Typexpress" viene da li)

---

### Mi hai annoiato con sti elenchi puntati! Dimmi riguardo le SESSION.
*[Bob]:* :unamused: c'e' il servizio specifico

[sandbox](https://codesandbox.io/s/session-i10vc?file=/src/index.js)  
https://i10vc.sse.codesandbox.io/sessioned/counter

```js
RootService.Start([
	{
		class: "http", port: "8080",
		children: [
			// SESSION MIDDLEWARE 
			{
				name: "typeorm-session",
				class: "http-router/session",
				typeorm: "/typeorm",
				path: "/sessioned",
				children: [
					// ROUTER
					{
						class: "http-router",
						routers: [
							{
								path: "/counter", 
								method: (req, res, next) => {
									if ( req.session.counter==null ) req.session.counter = 0 
									else req.session.counter++
									res.send(`<p>Counter: ${req.session.counter}</p>`)
								}
							},
						]
					}
				]
			},
		]
	},
	{
		class: "typeorm",
		options: {
			"type": "sqlite",
			"database": path.join(__dirname, "../db/database.sqlite"),
			"synchronize": true,
			"entities": [SessionEntity],
		},
	}
])
```

> Quindi tutti i figli di `http-router/session`  
> avranno la stessa sessione (memorizzata sul DB)  
> In futuro le session faranno riferimento a specifici REPOSITORY  
> in maniera da avere diverse session  

---

### Ma chi vuoi fregare!? Intendo JWT SESSION!!!
*[Bob]:* :triumph: Quanta pazienza!  
Puoi creare un SERVICE `jwt`   
con questo code/decode tramite parola segreta.  
Quindi usare un middleware specializzato  
per caricare i dati dell'utente `htt-router/jwt`

[sandbox](https://codesandbox.io/s/session-jwt-i3fgb?file=/src/index.js)  

```js
RootService.Start([
	// HTTP server
	{
		class: "http", port: 8080,
		children: [
			{
				class: "http-router",
				routers: [
					// HOME PAGE
					{
						method: function (req, res, next) {
							res.send(`<a href="/login">login</a><br/>
							<a href="/logout">logout</a><br/>
							<a href="/protect">enter protect area</a>`)
						}
					},
					// LOGIN
					{
						path: "/login", method: async function (req, res, next) {
							const token = await new Bus(this, "/http/route-jwt").dispatch({
								type: RouteJWTUserActions.TOKEN_BY_ID,
								payload: 10,
							})
							res.cookie('token', token)
							res.send(`<p>Logged in with token: ${token}</p>`)
						}
					},
					// LOGOUT
					{
						path: "/logout", method: async function (req, res, next) {
							res.cookie('token', "")
							res.send(`<p>Logout</p>`)
						}
					}
				]
			},
			// JWT MIDDLEWARE
			{
				class: "http-router/jwt",
				repository: "/typeorm/user",
				jwt: "/jwt",
				children: [
					{
						class: "http-router",
						path: "/protect",
						routers: [
							{ method: (req, res, next) => res.send(`<p>Hi ${req.user.username}</p>`) },
						]
					}
				]
			},
		]
	},
	// DB
	{
		class: "typeorm",
		options: {
			"type": "sqlite",
			"database": `${__dirname}/database.sqlite`,
			"synchronize": true,
		},
		schemas: [{
			name: "User",
			columns: {
				id: { type: Number, primary: true },
				username: { type: String }
			}
		}],
		children: [
			{ name: "user", class: "typeorm/repo", model: "User" }
		]
	},
	// code/decode JWT
	{
		class: "jwt",
		secret: "secret_word!!!"
	},

])
```

---







## Ciclo vita events
Chiamata PRIMA della creazione dei PROPRI CHILDREN
[sostituire con]: onCreate
protected async onInit(): Promise<void> { }

Chiamata DOPO la creazione dei PROPRI CHILDREN
[sostituire con]: onCreateAfter
protected async onInitAfter(): Promise<void> { }

[da fare]: chiamato per prima di inizializzare il nodo (e i children)
protected async onInitBefore(): Promise<void> { }

[da fare]: chiamato per inizializzare il nodo (e i children)
protected async onInit(): Promise<void> { }

Chiamato dopo il comando STOP e prima della rimozione del nodo dall'albero
protected async onDestroy(): Promise<void> { }


## Filosofia

TOP (tree oriented programming)

- Come in OOP ogni oggetto ha una singola responsabilità
Ma non esistono piu' "service" o oggetti aggregati
- Ogni oggetto può essere incapsulato in un parent o di avere un aggregato di children. Quindi l'oggetto diventa un NODE
- La comunicazione tra NODI è standardizzata (dispatch)
- L'assenza o il fallimento di un children puo' essere gestita in maniera generica
- Si puo' accedere a tutte le risorsa dello stesso albero conoscendo la "path" relativa o assoluta
- Lo stato dell'intero è dovuto alla somma degli stati di ogni NODE

## Features

### Tree structure
I nodi sono strutturati ad albero per cui è sempre possibile recuperare un NODE tramite il suo "path"

### Config
Ogni nodo ha un suo "config" che sarebbero delle props del nodo 

### State
ogni node ha uno stato interno inizialmente il config
(?history)

### Dispatch
i nodi hanno un set di ACTIONs che possono essere chiamate tramite la loro path
questi messaggi vengono recapitati dal Bus

### Events
un nodo puo' rimanere in ascolto su un altro nodo sugli eventi che genera quest'ultimo


## roadmap

### gestione errori
gli errori devono essere mandati tutti ad un nodo centralizzato e loggati correttamente
IMPORTANTE: gli errori dei router devono essere gestiti e bisogna restituire un errore 500! ora invece si blocca

### tipizzare
funzioni come dispatch e getNode devono essere parametrizzabili con i generic per restituire il tipo giusto

### auto-npm install
se un service ha necessità di un  pacchetto npm deve essere possibile istallarlo in automatico
// installare npm
https://stackoverflow.com/a/57914191/5224029

### Portals
permettono di creare servizi che possono far comunicare nodi in diverse posizioni sulla rete
per creare facilmente microservizi


