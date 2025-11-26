# GitHub Copilot Instructions for @priolo/julian

This is a Node.js/TypeScript server framework based on a hierarchical Service-Oriented Architecture.

## 🏗 Architecture

### Core Concepts
- **Tree Structure**: The application is a tree of **Nodes**.
- **Services**: The primary building blocks are **Services** (extending `ServiceBase` -> `NodeConf` -> `Node`).
- **RootService**: The entry point (`src/core/RootService.ts`). It bootstraps the application from a JSON configuration.
- **FarmService**: A special service (default child of Root) that acts as a factory/registry. It dynamically loads other services based on string identifiers (e.g., "http" -> `src/services/http`).
- **Bus**: A mechanism (`src/core/path/Bus.ts`) to dispatch **Actions** to nodes using file-system-like paths (e.g., `/root/http/my-router`).

### Data Flow
- **Configuration**: Passed as a JSON object/array to `RootService.Start(config)`.
- **Communication**:
  - **Direct**: Parent/Child access via `this.parent`, `this.children`.
  - **Bus**: `bus.dispatch({ type: 'ACTION_NAME' })` to send messages across the tree.
  - **Events**: `ServiceBase` has an `EventEmitter` for local events.

## 📂 Project Structure

- `src/core/`: Framework core (Node, ServiceBase, Bus, RootService).
- `src/services/`: Built-in services.
  - `farm/`: Service loader/factory.
  - `http/`: HTTP server (Express wrapper).
  - `http-router/`: Routing logic.
  - `typeorm/`: Database integration.
- `src/test_utils.ts`: Testing helpers.

## 💻 Development Patterns

### Creating a Service
1. Create a class extending `ServiceBase`.
2. Define its configuration interface (optional but recommended).
3. Implement `execute(action)` to handle incoming actions.

```typescript
import { ServiceBase } from "../../core/ServiceBase.js";

export class MyService extends ServiceBase {
    constructor(name: string, state: any) {
        super(name, state);
    }
    // ...
}
```

### Configuration (JSON)
Services are instantiated via configuration objects. The `class` property tells `FarmService` which service to load.

```javascript
{
    class: "http", // Loads src/services/http
    port: 8080,
    children: [
        {
            class: "http-router", // Loads src/services/http-router
            path: "/api",
            // ...
        }
    ]
}
```

## 🧪 Testing

- **Framework**: Jest with `ts-jest` (configured for ESM).
- **Integration Tests**: Prefer starting a real `RootService` instance in tests to verify service interaction.
- **Helpers**: Use `getFreePort()` from `src/services/ws/utils.ts` (or similar) to avoid port conflicts.

```typescript
import { RootService } from "../../index.js";

test("my service test", async () => {
    const root = await RootService.Start({
        class: "my-service",
        // ... config
    });
    const service = root.nodeByPath("/my-service");
    expect(service).toBeDefined();
    await RootService.Stop(root);
});
```

## 🚀 Build & Run

- **Build**: `npm run build` (runs `tsc`).
- **Watch**: `npm run build-watch`.
- **Test**: `npm test` (runs Jest with experimental VM modules).
