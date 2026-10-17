# AGENTS.md — @priolo/julian

Node.js/TypeScript server framework based on a hierarchical, service-oriented architecture (ESM).

## Architecture

- The application is a **tree of Nodes**. Building blocks are **Services** (`ServiceBase` -> `NodeConf` -> `Node`).
- `RootService` (`src/core/RootService.ts`) bootstraps the tree from a JSON config via `RootService.Start(config)`.
- `FarmService` (default child of Root) is a factory: it loads services by the `class` string (e.g. `"http"` -> `src/services/http`).
- `Bus` (`src/core/path/Bus.ts`) dispatches **Actions** to nodes by path (e.g. `/root/http/my-router`).
- Communication: direct (`this.parent`, `this.children`), Bus (`bus.dispatch({ type })`), local events (`ServiceBase` EventEmitter).

## Layout

- `src/core/` — Node, ServiceBase, Bus, RootService
- `src/services/` — built-in services: `farm`, `http`, `http-router`, `http-static`, `ws`, `typeorm`, `jwt`, `log`, `email`, `job`
- `src/test_utils.ts` — test helpers
- `docs/` — human-written documentation (start from `docs/index.md`; per-component config in `docs/components/`)

## Commands

- Build: `npm run build` (`tsc`) — watch: `npm run build-watch`
- Test: `npm test` (Jest, ESM, experimental VM modules)

## Conventions

- Create a service: extend `ServiceBase`, define a config interface, implement `execute(action)`.
- Services are configured by JSON objects; `class` selects the service:
  ```js
  { class: "http", port: 8080, children: [{ class: "http-router", path: "/api" }] }
  ```
- When writing or editing server config trees, read `docs/index.md` and the matching `docs/components/*.md` for exact `class` keys and property shapes. Do not invent properties; the source in `src/` is the final truth.
- Keep docs in sync when changing a service's public config.

## Testing

- Jest with `ts-jest` (ESM). Prefer integration tests that start a real `RootService`.
- Use `getFreePort()` (`src/services/ws/utils.ts`) to avoid port conflicts.

```typescript
import { RootService } from "../../index.js";

test("my service test", async () => {
    const root = await RootService.Start({ class: "my-service" });
    expect(root.nodeByPath("/my-service")).toBeDefined();
    await RootService.Stop(root);
});
```
