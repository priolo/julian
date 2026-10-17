# Component: `ws`

The `ws` (SocketServerService) handles WebSocket connections, authentication integration via JWT, and message routing. It is primarily responsible for establishing and tracking live connections (`wscat`).

## Configuration Identity
```json
{
    "class": "ws"
}
```

## JSON / TypeScript Schema (`SocketServerConf`)

```typescript
interface SocketServerConf {
    class: "ws" | string;
    /** Unique Node name */
    name?: string; 
    /** Automatically start connection listeners on bootstrap. Default: true */
    autostart?: boolean;
    /** 
     * Specific WS Port override. 
     * If left NULL (or undefined), it automatically attaches (`server.on('upgrade')`) 
     * out of its direct Express parent context (`HttpService`).
     */
    port?: number;
    /** Expected URL path to expose WS connection strings. e.g. "/stream" */
    path?: string;
    /** 
     * Auth mechanism: specify a path variable mapped to a `jwt` Service 
     * to validate connections automatically 
     */
    jwt?: string;
    /** Which cookie stores the JWT if available. (default "jwt") */
    cookieName?: string;
    /** Block connection based on JWT Payload values */
    onAuth?: (jwtPayload: any) => boolean;

    /** Handlers/Sub-Routes expecting WS messaging formats */
    children?: SocketRouteConf[];
}
```

## Bus Actions Supported
Using `.dispatch()` against the WS Node supports:

- **START**: Start the listener / bind HTTP.
- **STOP**: Unbind listners.

## Structural Rules
If `port` is provided, a standalone WS server is created.
If no `port` is provided, it **must** be placed as a `child` of an `http` component node.