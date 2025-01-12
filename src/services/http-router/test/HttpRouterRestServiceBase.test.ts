/**
 * @jest-environment node
 */
import http from 'http';
import { getFreePort } from "../../ws/index.js";
import { PathFinder, RootService } from "../../../index.js";
import { HttpRouterRestServiceBase } from "../rest/HttpRouterRestServiceBase.js";

let PORT: number;
let root: RootService

const users = [
	{ id: "1", name: "Ivano" },
	{ id: "2", name: "Mattia" },
	{ id: "3", name: "Giovanna" },
];

class TestRoute extends HttpRouterRestServiceBase {

	protected async getAll(): Promise<any[]> {
		return users;
	}

	protected async getById(id: string): Promise<any> {
		return users.find(u => u.id == id);
	}

	protected async save(entity: any): Promise<any> {
		if (entity.id) {
			const index = users.findIndex(u => u.id == entity.id);
			users.splice(index, 1, entity);
		} else {
			entity.id = (Math.round(Math.random() * 1000) + 1).toString();
			users.push(entity);
		}
		return entity;
	}

	protected async delete(id: string): Promise<void> {
		const index = users.findIndex(u => u.id == id);
		if (index != -1) users.splice(index, 1);
	}
}

beforeAll(async () => {
	PORT = await getFreePort();
	root = await RootService.Start([
		{
			class: "http",
			port: PORT,
			children: [
				{
					name: "test",
					class: TestRoute,
					path: "/user",
				}
			]
		}
	]);
});

afterAll(async () => {
	await RootService.Stop(root);
});

const httpRequest = (method: string, path: string, data?: any) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000, // Aggiungere un timeout di 5 secondi
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = body ? JSON.parse(body) : null;
                    resolve({ status: res.statusCode, data: parsedData });
                } catch (e) {
                    reject(new Error(`Failed to parse response body: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Request error: ${e.message}`));
        });

        req.on('timeout', () => {
            req.abort();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

test("su creazione", async () => {
	const test: TestRoute = PathFinder.Get(root, "/http/test");
	expect(test instanceof TestRoute).toBeTruthy();

	let res: any = await httpRequest('GET', `/user`);
	expect(res.data).toEqual(users);

	res = await httpRequest('GET', `/user/2`);
	expect(res.data).toEqual(users.find(u => u.id == "2"));

	res = await httpRequest('POST', `/user`, { name: "Raffaella" });
	expect(res.data).toEqual(users[users.length - 1]);

	res = await httpRequest('POST', `/user`, { name: "Giovanni", id: "3" });
	expect(users.find(u => u.id == "3")?.name).toEqual("Giovanni");

	res = await httpRequest('DELETE', `/user/3`);
	expect(users.findIndex(u => u.id == "3")).toEqual(-1);
}, 1000000);