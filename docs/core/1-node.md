## Classe Node
La classe Node è responsabile di mantenere la struttura ad albero.  
Implementa l'interfaccia INode e fornisce metodi per gestire i nodi figli e la struttura gerarchica.

### Importazioni
```typescript
import { nodeId } from "../utils.js";
import { INode } from "./INode.js";
```

### Costruttore
```typescript
constructor(name: string = "node") {
    this.name = name;
}
```
Il costruttore accetta un parametro opzionale name che imposta il nome del nodo. 
Se non viene fornito, il nome predefinito sarà "node".

### Proprietà
- id: string
```typescript
id: string = nodeId();
```
Identificatore univoco del nodo, generato utilizzando la funzione nodeId.

- name: string
```typescript
name: string;
```
Nome del nodo.

- parent: INode | null
```typescript
parent: INode | null = null;
```
Nodo genitore. Se il nodo è radice, parent sarà null.

- children: INode[]
```typescript
get children(): INode[] {
    return this._children;
}
```
Restituisce un array di nodi figli. Questa proprietà è di sola lettura.


### Metodi

- addChild(child: INode): void
```typescript
addChild(child: INode): void {
    if (child == null) throw new Error("ivalid parameter");
    this._children.push(child);
    child.parent = this;
}
```
Aggiunge un nodo figlio. Se il parametro child è null, viene lanciata un'eccezione.

- removeChild(child: INode | number): void
```typescript
removeChild(child: INode | number): void {
    const index = typeof child != "number" ? this.indexChild(child) : child;
    if (index == -1) return;
    this._children.splice(index, 1).forEach(n => n.parent = null);
}
```
Rimuove un nodo figlio. Il parametro child può essere un'istanza di INode o un indice numerico. Se il nodo non viene trovato, non viene eseguita alcuna operazione.

- indexChild(child: INode): number
```typescript
indexChild(child: INode): number {
    if (child == null) return -1;
    return this._children.indexOf(child);
}
```
Restituisce l'indice di un nodo figlio. Se il nodo non viene trovato, restituisce -1.


### Esempi di Utilizzo

Creazione di un Nodo
```typescript
const root = new Node("root");
console.log(root.children.length); // Output: 0
```

Aggiunta di Nodi Figli
```typescript
const root = new Node("root");
const child1 = new Node("child1");
child1.addChild(new Node("child1.1"));
child1.addChild(new Node("child1.2"));
root.addChild(child1);
root.addChild(new Node("child2"));

console.log(root.children.length); // Output: 2
console.log(child1.children.length); // Output: 2
```

Rimozione di Nodi Figli
```typescript
const root = new Node("root");
const child1 = new Node("child1");
root.addChild(child1);
root.addChild(new Node("child2"));
root.addChild(new Node("child3"));

console.log(root.children.length); // Output: 3

root.removeChild(1); // Rimuove "child2"
root.removeChild(child1); // Rimuove "child1"

console.log(root.children.length); // Output: 1
```

Test
```typescript
I test per la classe Node sono definiti in Node.test.ts. Questi test verificano la creazione di nodi, l'aggiunta e la rimozione di nodi figli.
```