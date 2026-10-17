# @priolo/julian - AI Component Registry

This directory contains component specifications required to build web servers and backends using the `@priolo/julian` framework.

The framework is a node-based configuration system bootstrapped strictly via JSON/JS objects (passed to `RootService.Start({...})`). Each node in the tree corresponds to a Service, loaded via the `class` property.

## Available Core Components

*   [**http**](./components/http.md): The core HTTP Express Server. Required to serve APIs, static files, or host WebSockets on the same port.
*   [**http-router**](./components/http-router.md): Maps REST HTTP requests to handler functions. Usually placed inside `http` -> `children`.
*   [**http-static**](./components/http-static.md): Serves static files from a directory over HTTP.
*   [**ws**](./components/ws.md): The WebSocket Server. Attached to an `http` parent.
*   [**typeorm**](./components/typeorm.md): SQL Database Service. Connects to the DB and loads child entities.
*   [**jwt**](./components/jwt.md): Handles JSON Web Tokens for authentication.
*   [**log**](./components/log.md): Global logging service.
*   [**email**](./components/email.md): SMTP configuration service for sending emails.
*   [**job**](./components/job.md): Background job runner service.

## Server Building Guidelines

To construct a Julian server:

1.  **Always refer to component files** in `docs/components/*.md` for the exact JSON shape.
2.  Do NOT invent properties; stick strictly to the documented `NodeConf` shapes.
3.  Combine components using `children: [...]`.
4.  To create custom services, extend `ServiceBase`, define `stateDefault`, map `executablesMap`, and add them to the tree with `{ class: MyCustomService }` (if instantiated via class reference) or load them securely through your entry tree.

### Example: Basic REST + DB Setup

```typescript
import { RootService, http, httpRouter, typeorm } from "@priolo/julian";

const config = {
    class: "http",
    port: 3000,
    children: [
        {
            class: "http-router",
            path: "/api",
            routers: [
                {
                    verb: "get",
                    path: "/ping",
                    method: (req, res) => res.json({ ok: true })
                }
            ]
        },
        {
            class: "typeorm",
            options: {
                type: "sqlite",
                database: "database.sqlite",
                synchronize: true
            },
            children: [
                // Child repos here...
            ]
        }
    ]
};

await RootService.Start(config);
```
