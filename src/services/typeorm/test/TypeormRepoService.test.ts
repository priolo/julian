import fs from "fs";
import path from "path";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { PathFinder } from "../../../core/path/PathFinder.js";
import { RepoRestActions } from "../../../core/service/utils.js";
import { RootService } from "../../../core/RootService.js";
import * as typeormNs from "../index.js";
import { fileURLToPath } from 'url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar" })
	firstName: string;

	@Column({ type: "varchar" })
	lastName: string;

	@Column({ type: "int" })
	age: number;
}

const dbPath = path.join(__dirname, "/database.sqlite")
let root: RootService = null

beforeAll(async () => {
	try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath) }
	catch (e) { console.log(e) }

	root = await RootService.Start({
		class: "typeorm",
		options: {
			"type": "sqlite",
			"database": dbPath,
			"synchronize": true,
			"entities": [User]
		},
		schemas: [
			{
				name: "Account",
				columns: {
					id: { type: Number, primary: true, generated: true },
					username: { type: String }
				}
			}
		],
		children: [
			{
				name: "user", 			// nome da usare nella "path" per trovare questo nodo (p.e. questo è "/typeorm/user") 
				class: "typeorm/repo",
				model: "User", 			// se è una stringa fa riferimento ad un "model" gia' inserito
			},
			{
				name: "account",
				class: "typeorm/repo",
				model: "Account",
			},
			{
				name: "item",
				class: "typeorm/repo",
				model: {				// se è un oggetto è uno "entity-definition" https://typeorm.io/#/separating-entity-definition 
					name: "Item",
					columns: {
						id: { type: Number, primary: true, generated: true },
						name: { type: String }
					}
				},
			},
		]
	})
})
afterAll(async () => {
	await RootService.Stop(root)
	try {
		if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
	} catch (e) {
		console.log(e)
	}
})

test("USER", async () => {

	const rep = new PathFinder(root).getNode<typeormNs.repo>("/typeorm/user")
	expect(rep).toBeInstanceOf(typeormNs.repo)

	// crea due USER
	await rep.execute({
		type: RepoRestActions.SAVE,
		payload: {
			firstName: "Ivano",
			lastName: "Iorio",
			age: 45,
		}
	})
	await rep.execute({
		type: RepoRestActions.SAVE,
		payload: {
			firstName: "Marina",
			lastName: "Bossi",
			age: 32,
		}
	})

	// preleva uno specifico USER
	let user = await rep.execute({
		type: typeormNs.Actions.FIND,
		payload: { where: { firstName: "Marina" } }
	})
	expect(user).toMatchObject([
		{ firstName: 'Marina', lastName: 'Bossi', age: 32 }
	])

	// preleva tutti gli USER
	let users = await rep.execute({ type: RepoRestActions.ALL })
	expect(users).toMatchObject([
		{ firstName: 'Ivano', lastName: 'Iorio', age: 45 },
		{ firstName: 'Marina', lastName: 'Bossi', age: 32 }
	])

	// modifica lo USER con id = 2
	await rep.execute({
		type: RepoRestActions.SAVE,
		payload: <User>{
			id: 2, // ATTENZIONE deve essere un id in questo caso!
			firstName: "Marino",
		}
	})

	// preleva lo USER con id = 2
	user = await rep.execute({ type: RepoRestActions.GET_BY_ID, payload: 2 })
	expect(user).toEqual(
		{ id: 2, firstName: 'Marino', lastName: 'Bossi', age: 32 }
	)

	// elimina lo USER con id = 2
	await rep.execute({ type: RepoRestActions.DELETE, payload: 2 })
	users = await rep.execute({ type: RepoRestActions.ALL })
	expect(users).toEqual([
		{ id: 1, firstName: 'Ivano', lastName: 'Iorio', age: 45 },
	])

	// elimina lo USER con "firstName" uguale a "XXX" (che non c'e')
	await rep.execute({ type: RepoRestActions.DELETE, payload: { firstName: "XXX" } })
	users = await rep.execute({ type: RepoRestActions.ALL })
	expect(users).toHaveLength(1)

	// elimina lo USER con "firstName" uguale a "Ivano"
	await rep.execute({ type: RepoRestActions.DELETE, payload: { firstName: "Ivano" } })
	users = await rep.execute({ type: RepoRestActions.ALL })
	expect(users).toHaveLength(0)
})

test("ACCOUNT", async () => {

	const rep = new PathFinder(root).getNode<typeormNs.repo>("/typeorm/account")
	expect(rep).toBeInstanceOf(typeormNs.repo)

	// crea due ACCOUNT
	await rep.execute({
		type: RepoRestActions.SAVE,
		payload: {
			username: "priolo",
		}
	})
	let account = await rep.execute({
		type: RepoRestActions.SAVE,
		payload: {
			username: "huetotolin",
		}
	})

	// preleva uno specifico ACCOUNT
	let [account2] = await rep.execute({
		type: typeormNs.Actions.FIND,
		payload: { where: { username: "huetotolin" } }
	})
	expect(account).toEqual(account2)
})

test("ITEMS", async () => {

	const rep = new PathFinder(root).getNode<typeormNs.repo>("/typeorm/item")
	expect(rep).toBeInstanceOf(typeormNs.repo)

	// crea due ITEM
	await rep.execute({
		type: RepoRestActions.SAVE,
		payload: {
			name: "scarpa",
		}
	})
	let item = await rep.execute({
		type: RepoRestActions.SAVE,
		payload: {
			name: "barattolo",
		}
	})

	// preleva uno specifico ITEM
	let [item2] = await rep.execute({
		type: typeormNs.Actions.FIND,
		payload: { where: { name: "barattolo" } }
	})
	expect(item).toEqual(item2)
})
