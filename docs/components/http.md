# Component: `http`

The `http` component represents an Express server instance. It handles incoming HTTP connections on a specific port and distributes them to any child components that handle routing (like `http-router`, `http-static`, or `ws`).

## Configuration Identity
```json
{
    "class": "http"
}
```

## JSON / TypeScript Schema (`HttpServiceConf`)

```typescript
interface HttpServiceConf {
    class: "http";
    /** Default node name */
    name?: string; 
    /** Port to listen on (e.g. 5000) */
    port?: number; 
    /** Express instance options */
    options?: { [key: string]: any }; 
    /** Https configuration. If set, creating an https server. */
    https?: {
        privkey: string; // path to private key
        pubcert: string; // path to public cert
    };
    /** Paths (using wildcards) parsed as raw-body instead of JSON */
    rawPaths?: string[]; 
    /** Logging configuration */
    log?: boolean | { method?: boolean; body?: boolean; header?: boolean }; 
    /** 
     * Child services to mount on this server 
     * Examples: `http-router`, `http-static`, `ws`
     */
    children?: Array<any>; 
}
```

## Structural Rules
- Must be a top-level node or at least a node capable of running independently.
- Automatically handles basic express middleware (like `express.json()`, `cookie-parser`).
- When a `ws` (SocketServerService) child is provided, it attaches WebSocket upgrades over the same HTTP port.
