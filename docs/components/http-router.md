# Component: `http-router`

The `http-router` component binds RESTful routes to specific controller functionalities. It inherits from `HttpRouterServiceBase` to map a base path and expose multiple HTTP verbs handling Request/Response logic.

## Configuration Identity
```json
{
    "class": "http-router"
}
```

## JSON / TypeScript Schema (`HttpRouterServiceConf`)

```typescript
interface HttpRouterServiceConf {
    class: "http-router" | "new (...args: any[]) => HttpRouterService";
    /** Node name (useful for Bus routing) */
    name?: string; 
    /** 
     * Base path to mount this router upon the parent `http` service 
     * e.g., "/api"
     */
    path?: string; 
    /** Auto-wrap endpoints in a generic try-catch to avoid app crashing */
    handleErrors?: boolean;
    /** The individual endpoints / routes managed by this node */
    routers?: IRouteParam[];
    children?: any[]; 
}

interface IRouteParam {
    /** Additional URL sub-path, e.g., "/users" */
    path?: string;
    /** HTTP Verb: "get", "post", "put", "delete", "patch" (default: "get") */
    verb?: string; 
    /** 
     * The callback method processing the Express Request
     * Can be a string matching a method name on an extended custom class, 
     * or it can be a plain function.
     */
    method: string | ((req: Request, res: Response, next: any) => any);
    /** Read body exactly as text/raw instead of parsed JSON */
    isRaw?: boolean;
}
```

## Creating Custom Routers

Generally, you will subclass `HttpRouterService` to create custom endpoint logic:

```typescript
import { httpRouter } from "@priolo/julian";

export class UserRouter extends httpRouter.Service {
    get stateDefault() {
        return {
            ...super.stateDefault,
            path: "/users",
            routers: [
                { verb: "get", path: "/", method: this.getUsers },
                { verb: "post", path: "/", method: "createUser" }
            ]
        };
    }

    async getUsers(req, res) {
        res.json([{ id: 1, name: "Admin" }]);
    }
    async createUser(req, res) {
        res.json({ ok: true });
    }
}
```

And in the configuration JSON structure:
```json
{
    "class": UserRouter
}
```