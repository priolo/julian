## NodeState
La classe NodeState è una classe astratta che estende la classe Node. È responsabile di mantenere uno stato (state), modificarlo, notificare i cambiamenti e eseguire azioni (actions).

### Costruttore
```typescript
constructor(name?: string, state?: any)
```
name (opzionale): Il nome del nodo.
state (opzionale): Lo stato iniziale del nodo.
Il costruttore inizializza lo stato del nodo unendo lo stato predefinito (stateDefault) con lo stato fornito.


### Proprietà

- **stateDefault**:  
Restituisce lo stato predefinito del nodo. 
Questo viene unito con lo stato di istanza nel costruttore.
Va implementato sulle classi derivate.
```typescript
class MyNode extends NodeState {
  get stateDefault() {
		return {
			...super.stateDefault,
			text: "",
		}
	}
}
```

- **state**:  
Restituisce lo stato attuale del nodo.
```typescript
const { text } = root.getChild("my_node").state
```


### Metodi

- **setState(state: any): void**  
Modifica lo stato del nodo. 
Unisce il parametro "state" con quello attuale. 
Se lo stato cambia, chiama il metodo onChangeState.
```typescript
root.getChild("my_node").setState({ text: "new text" })
```

- **protected onChangeState(old: any): void**  
Metodo astratto chiamato quando lo stato cambia. 
Deve essere implementato dalle classi derivate.
```typescript
class MyNode extends NodeState {
  protected onChangeState(old: any): void {
		super.onChangeState(old)
		// ...
	}
}
```


- **dispatchMap**:  
Restituisce una mappa di possibili azioni (actions) che possono essere eseguite su questo nodo. 
Deve essere sovrascritto dalle classi derivate.
```typescript
class MyNode extends NodeState {
  get dispatchMap() {
    return {
        ...super.dispatchMap,
        ["log"]: (state, payload) => console.log(`action: ${payload}`),
    }
  }
}
```

- **dispatch(action: IAction): any**:  
Esegue un'azione utilizzando la mappa di dispatch (dispatchMap). 
Se l'azione è asincrona, restituisce una Promise.
```typescript
root.getChild("my_node").dispatch({ type: "log", payload: "hello!" })
```

- **dispatchToChild(path: string, action: IAction): any**
Esegue un'azione su un nodo figlio.
```typescript
root.dispatchTo("my_path/child_node", { type: "log", payload: "hello!" })
```


### Tipi

- **NodeStateConf**:  
Tipo che rappresenta una configurazione parziale dello stato predefinito del nodo.
```typescript
export type NodeStateConf = Partial<NodeState['stateDefault']>
```

- **DispatchMap**:  
Tipo che rappresenta una mappa di funzioni di dispatch.
```typescript
type DispatchMap = { [key: string]: Dispatch }
```

- **Dispatch**:  
Tipo che rappresenta una funzione di dispatch.
```typescript
type Dispatch = (state: any, payload: any, sender: string) => any
```


### Esempio di Utilizzo

Ecco un esempio di come estendere e utilizzare la classe NodeState:

```typescript
const node = new class extends NodeState {
  protected _state = {
    value1: "init value1",
    value2: "init value2"
  }
}

node.setState({ value2: "modify value2" })
console.log(node.state) // { value1: "init value1", value2: "modify value2" }
```

In questo esempio, la classe anonima estende NodeState e definisce uno stato iniziale. Successivamente, modifica lo stato utilizzando setState e stampa lo stato attuale.