import path from "path";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { fileURLToPath } from 'url';
import { RootService } from "../../../core/RootService.js";
import { Bus } from "../../../core/path/Bus.js";
import { PathFinder } from "../../../core/path/PathFinder.js";
import { RepoRestActions, RepoStructActions } from "../../../core/service/utils.js";
import { deleteIfExist } from "../../fs/index.js";
import * as orm from "../index.js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "/database.sqlite")
let root: RootService

@Entity()
export class Item {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar"})
	label: string;
}




beforeAll(async () => {

	await deleteIfExist(dbPath)

	root = await RootService.Start(
		[
			{
				class: "typeorm",
				options: {
					type: "sqlite",
					database: dbPath,
					synchronize: true,
					entities: [Item]
				},
				children: [
					{
						name: "user", 
						class: "typeorm/repo",
						findOptions: { relations: ["documents"] },
						model: {
							name: "User",
							columns: {
								id: { type: Number, primary: true, generated: true },
								firstName: { type: String, default: "" },
								lastName: { type: String, default: "" },
								age: { type: Number, default: 18 },
							},
							// https://typeorm.io/#/separating-entity-definition
							// https://typeorm.delightful.studio/interfaces/_entity_schema_entityschemarelationoptions_.entityschemarelationoptions.html
							relations: {
								documents: {
									type: "one-to-many",
									target: "Doc",
									cascade: true,
									inverseSide: 'author',
									//createForeignKeyConstraints: false,	
									//onDelete: "CASCADE",
								}

							}
						},
					},
					{
						name: "doc", 
						class: "typeorm/repo",
						model: {
							name: "Doc",
							columns: {
								id: { type: Number, primary: true, generated: true },
								text: { type: String, default: "" },
							},
							// https://typeorm.io/#/separating-entity-definition
							// https://typeorm.delightful.studio/interfaces/_entity_schema_entityschemarelationoptions_.entityschemarelationoptions.html
							relations: {
								author: {
									type: "many-to-one",
									target: "User",
									//createForeignKeyConstraints: false,	
									//cascade: true,
									//inverseSide: 'documents',
									//joinColumn: 'authorId',
									onDelete: "CASCADE",
								}
							}
						}
					},
					{
						name: "item", 
						class: "typeorm/repo", 
						model: "Item",
						seeds: [
							{ type: RepoStructActions.TRUNCATE },
							{ label: "primo" }, { label: "secondo" }, { label: "terzo" }, { label: "quarto" }, { label: "quinto" }, { label: "sesto" },
						]
					},
				]
			}
		]
	)

	await new Bus(root, "/typeorm/item").dispatch({ type: RepoStructActions.SEED })
})

afterAll(async () => {
	await RootService.Stop(root)
	//try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath) } catch (e) { console.log(e) }
})

test("Check seed create", async () => {

	// creo gli user con un SEED
	const rep = new PathFinder(root).getNode<orm.repo>("/typeorm/user")
	await rep.execute({
		type: RepoStructActions.SEED,
		payload: [
			`INSERT INTO User (firstName, lastName, age) VALUES ("Ivano", "Iorio", 45);`,
			{
				firstName: "Marina", lastName: "Bossi", age: 32, documents: [
					{ text: "doc1" },
					{ text: "doc2" },
					{ text: "doc3" },
				]
			}
		]
	})

	// CONTROLLO GLI USER
	let users = await rep.execute({ type: RepoRestActions.ALL })
	expect(users).toMatchObject([
		{ firstName: 'Ivano', lastName: 'Iorio', age: 45 },
		{
			firstName: 'Marina', lastName: 'Bossi', age: 32, documents: [
				{ text: "doc1" },
				{ text: "doc2" },
				{ text: "doc3" },
			]
		}
	])

	// ELIMINO GLI USER CON UN SEED
	await rep.execute({
		type: RepoStructActions.SEED, payload: [
			{ type: RepoStructActions.CLEAR },
		]
	})

	// CONTROLLO CHE NON CI SIANO PIU'
	users = await rep.execute({ type: RepoRestActions.ALL })
	expect(users.length).toEqual(0)
})

test("Check seed config", async () => {

	// ESEGUO UN SEED DA CONFIG
	const rep = new PathFinder(root).getNode<orm.repo>("/typeorm/item")
	let items = await rep.execute({ type: RepoRestActions.ALL })
	expect(items[0].label).toBe("primo")
	expect(items[1].label).toBe("secondo")
	expect(items[5].label).toBe("sesto")
})

test("Check delete cascade", async () => {
	// creo gli user con un SEED
	let rep = new PathFinder(root).getNode<orm.repo>("/typeorm/user")
	await rep.execute({
		type: RepoStructActions.SEED,
		payload: [
			{
				firstName: "Marina", lastName: "Bossi", age: 32, documents: [
					{ text: "doc1" },
					{ text: "doc2" },
					{ text: "doc3" },
				]
			},
			{
				firstName: "Ivano", lastName: "Iorio", age: 45, documents: [
					{ text: "doc4" },
				]
			},
		]
	})

	let users = await rep.execute({ type: orm.Actions.FIND, payload: { where: { firstName: "Marina" }} })
	await rep.execute({ type: RepoRestActions.DELETE, payload: users[0].id})

	users = await rep.execute({ type: orm.Actions.FIND, payload: { where: { firstName: "Marina" }} })
	expect(users.length).toBe(0)

	rep = new PathFinder(root).getNode<orm.repo>("/typeorm/doc")
	let docs = await rep.execute({ type: RepoRestActions.ALL})
	expect(docs.length).toBe(1)
})
