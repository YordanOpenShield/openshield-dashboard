# OpenShield Dashboard

A Next.js application with Better Auth authentication, PostgreSQL database, and a plugin system for extensibility.

## Features

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Better Auth** for authentication
- **PostgreSQL** database with `pg` driver
- **Plugin System** — extend functionality with independently developed plugins

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- **Database:** `openshield`
- **User:** `openshield`
- **Password:** `openshield`

### 3. Configure environment variables

The `.env.local` file is already configured to work with the Docker PostgreSQL:

```bash
# .env.local
DATABASE_URL=postgresql://openshield:openshield@localhost:5432/openshield
```

### 3. Set up the database

Better Auth will automatically create the necessary tables on first run. Make sure your PostgreSQL database is running and accessible.

### 4. Initialize Database Tables

Better Auth requires database tables. Use the Better Auth CLI:

```bash
# Generate migration files
npx @better-auth/cli@latest generate

# Or apply migrations directly
npx @better-auth/cli@latest migrate
```

Or use the init endpoint:

PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/init-db -Method POST
```

Or Bash/curl:
```bash
curl -X POST http://localhost:3000/api/init-db
```

### 5. Create a default user

**Registration is disabled.** Users can only be created via the seed endpoint.

Default user credentials are configured in `.env.local`:
- `DEFAULT_USER_EMAIL` - The email address (default: admin@example.com)
- `DEFAULT_USER_PASSWORD` - The password (default: password123)
- `DEFAULT_USER_NAME` - The display name (default: Admin User)

After initializing the database, create the default user:

PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/seed -Method POST
```

Or Bash/curl:
```bash
curl -X POST http://localhost:3000/api/seed
```

Then log in at http://localhost:3000/login with the configured credentials.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Plugin System

The dashboard supports a WordPress-style plugin system. Plugins are developed independently, compiled into a `.zip` archive, and installed via the admin UI.

### Quick Start for Plugin Authors

```bash
# Scaffold a new plugin
npx @open_shield/plugin-builder init --name my-plugin
cd my-plugin

# Install dependencies
npm install

# Build the plugin
npm run build
# → plugin-my-plugin-1.0.0.zip

# Upload the .zip via Admin → Plugins → Upload Plugin
# Then restart the dashboard server
```

### Plugin Structure

```
my-plugin/
├── manifest.json              ← Plugin declaration (required)
├── src/
│   ├── server/
│   │   ├── index.ts           ← API routes + DB lifecycle (optional)
│   │   └── migrations/        ← SQL migrations (optional)
│   └── client/
│       └── index.tsx           ← React components (optional)
└── assets/
    └── icon.svg               ← Plugin icon (optional)
```

### What Plugins Can Do

| Capability | How |
|------------|-----|
| **New pages** | Declare pages in `manifest.json` under `/plugin/<id>/...` |
| **API endpoints** | Declare API routes handled by the server bundle at `/api/plugin/<id>/...` |
| **Custom React UI** | Provide React components rendered inside the dashboard's dark theme |
| **Database tables** | Run SQL migrations on install, drop on uninstall |
| **Navigation items** | Add links to the main navbar or admin sidebar |
| **Permissions** | Declare new RBAC resources/actions that integrate with the role editor |
| **Action hooks** | Register buttons that appear on existing pages (agent detail, dashboard, etc.) |
| **Settings** | Declare a JSON Schema for admin-configurable settings |

### Manifest Reference

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Description of my plugin",
  "requires": "^1.0.0",
  "permissions": {
    "my_plugin": ["read", "write"]
  },
  "navigation": [
    { "type": "main", "label": "My Plugin", "href": "/plugin/my-plugin", "permission": "my_plugin:read" }
  ],
  "pages": {
    "": { "component": "Dashboard", "title": "Dashboard", "permission": "my_plugin:read" }
  },
  "api": {
    "data": { "methods": ["GET"] }
  },
  "hooks": [
    {
      "location": "agent-detail-toolbar",
      "label": "My Action",
      "permission": "my_plugin:read",
      "action": { "type": "navigate", "page": "my-page", "params": { "agentId": "{agentId}" } }
    }
  ],
  "settingsSchema": {
    "type": "object",
    "properties": {
      "mySetting": { "type": "boolean", "default": true }
    }
  }
}
```

### Installing a Plugin

1. Go to **Admin → Plugins**
2. Click **Upload Plugin**
3. Select the `.zip` file
4. **Restart the dashboard server**
5. The plugin's nav items, pages, API endpoints, and permissions are now available

### Uninstalling a Plugin

1. Go to **Admin → Plugins**
2. Click **Uninstall** on the plugin card
3. **Restart the dashboard server**
4. All plugin files, DB tables, and registry entries are removed

### SDK & CLI

The plugin toolchain is published as npm packages:

| Package | Purpose |
|---------|---------|
| [`@open_shield/plugin-sdk`](https://www.npmjs.com/package/@open_shield/plugin-sdk) | TypeScript types and helpers (`definePlugin`, `createPluginUI`, `createManifest`) |
| [`@open_shield/plugin-builder`](https://www.npmjs.com/package/@open_shield/plugin-builder) | CLI for scaffolding, compiling, and packaging plugins |

### Example Plugin

A full working compliance plugin example is at [`examples/compliance/`](./examples/compliance/) with:

- 3 database tables (risks, assets, scans)
- 6 API endpoints
- 3 React pages (Dashboard, Risks, Assets)
- Action hooks on the agent detail toolbar
- Server-rendered initial data via data fetchers

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/             # Admin API (roles, plugins, permissions, SSO)
│   │   ├── auth/              # Better Auth API routes
│   │   ├── hooks/             # Plugin action hook API
│   │   ├── init-db/           # Database initialization
│   │   ├── plugin/            # Catch-all plugin API routes
│   │   └── seed/              # Default user seeding
│   ├── admin/                 # Admin panel (users, roles, SSO, plugins)
│   ├── agents/                # Agent management
│   ├── dashboard/             # Main dashboard
│   ├── login/                 # Login page
│   ├── plugin/                # Catch-all plugin page routes
│   └── ...                    # Other app pages
├── components/
│   ├── action-hooks.tsx       # Plugin action hook UI components
│   ├── admin-sidebar-nav.tsx  # Admin sidebar navigation
│   ├── dynamic-form.tsx       # Dynamic form from JSON Schema
│   ├── navbar.tsx             # Navigation with plugin data integration
│   ├── plugin-content.tsx     # Plugin client bundle loader
│   └── plugin-shell.tsx       # Plugin page layout
├── examples/
│   └── compliance/            # Example compliance plugin
├── lib/
│   ├── plugins/               # Plugin system core
│   │   ├── types.ts           # Type definitions
│   │   ├── registry.ts        # Plugin registry (discovery, loading, Zod validation)
│   │   ├── loader.ts          # Filesystem operations, zip extraction, migrations
│   │   ├── hooks.ts           # Action hook system
│   │   └── index.ts           # Barrel exports
│   ├── auth.ts                # Better Auth server configuration
│   ├── auth-client.ts         # Better Auth client
│   ├── permissions.ts         # RBAC permission system
│   └── db.ts                  # PostgreSQL connection
├── packages/
│   ├── plugin-sdk/            # @open_shield/plugin-sdk source
│   └── plugin-builder/        # @open_shield/plugin-builder source
├── plugins/                   # Installed plugin files (gitignored)
└── public/plugins/            # Plugin client bundles (gitignored)
```

## Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Lint check
```

## Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# Stop and remove data (start fresh)
docker-compose down -v

# View logs
docker-compose logs -f postgres
```

## Learn More

- [Better Auth Documentation](https://www.better-auth.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [@open_shield/plugin-sdk on npm](https://www.npmjs.com/package/@open_shield/plugin-sdk)
- [@open_shield/plugin-builder on npm](https://www.npmjs.com/package/@open_shield/plugin-builder)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
