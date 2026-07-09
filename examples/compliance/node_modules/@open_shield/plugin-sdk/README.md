# @open_shield/plugin-sdk

TypeScript types and helpers for building OpenShield Dashboard plugins.

## Installation

```bash
npm install @open_shield/plugin-sdk
```

Peer dependencies: `react` ^19.0.0, `react-dom` ^19.0.0

## Usage

### Server Bundle (`src/server/index.ts`)

```typescript
import { definePlugin } from "@open_shield/plugin-sdk";

export default definePlugin({
  async install(context) {
    await context.db.query(`CREATE TABLE IF NOT EXISTS my_data (id UUID PRIMARY KEY, ...)`);
  },

  api: {
    "data:GET": async (request, context) => {
      const result = await context.db.query("SELECT * FROM my_data");
      return Response.json(result.rows);
    },
  },
});
```

### Client Bundle (`src/client/index.tsx`)

```typescript
import { createPluginUI } from "@open_shield/plugin-sdk";

function Dashboard({ initialData }: { initialData: unknown }) {
  return <div>Hello from my plugin!</div>;
}

export default createPluginUI({
  name: "My Plugin",
  initialize(registry) {
    registry.registerPage("Dashboard", Dashboard);
  },
});
```

### Manifest (`manifest.ts`)

```typescript
import { createManifest } from "@open_shield/plugin-sdk";

export default createManifest({
  id: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  permissions: { my_resource: ["read"] },
  pages: {
    "": { component: "Dashboard", title: "Dashboard" },
  },
});
```

## API

### `definePlugin(config)`

Creates a type-safe server bundle. See `PluginServerModule` for the full config shape.

### `createPluginUI(config)`

Creates a type-safe client bundle. Plugins register React components via the `registry` object in `initialize()`.

### `createManifest(config)`

Creates a type-safe plugin manifest. Use this in `manifest.ts` to get full intellisense.

## Types

- `PluginManifest` — Plugin metadata, permissions, navigation, pages, API endpoints
- `PluginServerModule` — Server bundle shape (install, uninstall, api handlers, dataFetchers)
- `PluginClientModule` — Client bundle shape (name, initialize, uninitialize)
- `RequestContext` — Context passed to server handlers (db, auth, permissions, pluginConfig)
- `PluginNavigationItem` — Navigation item definition
- `PluginActionHook` — UI hook definition (buttons/tabs on existing pages)
