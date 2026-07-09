# OpenShield Agent Manager Dashboard

A Web UI for the OpenShield Agent Manager — monitor, manage, and query your agent fleet in real time.

Built with **Next.js 16** (App Router), **Better Auth**, **PostgreSQL**, and a dark glassmorphism design system.

## Features

### 🔌 Agent Management
- **Live agent list** — view connected/disconnected agents with metadata
- **Agent details** — inspect addresses, services, and available tools
- **Tool execution** — run tools (e.g., ClamAV scan, fail2ban) directly from the UI
- **Unregister** — remove agents from the fleet

### 📋 Jobs & Tasks
- **Job templates** — define commands or scripts as reusable job definitions
- **Task assignment** — assign jobs to specific agents
- **Execution tracking** — monitor task status (PENDING → RUNNING → COMPLETED/FAILED)
- **Result inspection** — view task output and error details

### 📊 FleetDM-Style Queries
- **SQL query editor** — write and save osquery-compatible SQL queries
- **Schema reference** — built-in osquery table/column browser for beginners
- **Inline autocomplete** — table names, column names, and SQL keywords
- **Query execution** — run queries against one or more agents
- **Execution history** — track results per agent with timing metadata
- **Result viewer** — formatted JSON output with status badges
- **Create, edit, delete queries** — full CRUD with bulk delete support

### 👥 Agent Groups
- **Static groups** — manually add/remove agents
- **Dynamic groups** — auto-populate based on criteria (OS, state, last seen)
- **Bulk targeting** — target groups for jobs and queries via bulk operations

### 📦 Bulk Operations
- **Batch actions** — assign tasks, run queries across multiple agents
- **Progress tracking** — monitor completion, partial, and failure counts
- **Cancel in-flight** — abort running bulk operations

### 🔐 Authentication & Admin
- **Email/password auth** — powered by Better Auth
- **SSO** — OIDC and SAML provider support (Keycloak, Okta, etc.)
- **RBAC** — role-based access control with custom role definitions
- **User management** — create, edit, ban, delete users
- **Role editor** — permission matrix for fine-grained access control
- **Session management** — view and revoke active sessions

### 🎨 Design
- Dark theme with glassmorphism cards (`bg-[#111111]/80 backdrop-blur-md`)
- Gradient accents (`from-violet-500 to-blue-500`)
- Responsive layout with collapsible navigation
- Loading skeletons and empty states throughout
- Real-time SSE event streams (opt-in toggle)

## Architecture

```
┌─ Browser ──────────────────────────────┐
│  /dashboard  /agents  /jobs  /queries  │
│  /tasks  /groups  /bulk-operations     │
│         /admin/*                        │
└──────────────┬──────────────────────────┘
               │
         Next.js Rewrites
               │
┌──────────────▼──────────────────────────┐
│  Manager API (localhost:9000)           │
│  /api/agents/*  /api/jobs/*             │
│  /api/queries/*  /api/groups/*          │
│  /api/tasks/*  /api/bulk-operations/*   │
│  /events/* (SSE)                        │
└─────────────────────────────────────────┘
```

The dashboard proxies all manager API calls through Next.js rewrites configured in `next.config.ts`. Server components call the manager API directly, while client components use relative URLs that hit the proxy.

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- [OpenShield Manager](https://github.com/YordanOpenShield/openshield-manager) running on `localhost:9000` (or your configured `MANAGER_API_URL`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with:
- **Database:** `openshield`
- **User:** `openshield`
- **Password:** `openshield`

### 3. Configure environment

Copy `.env.example` to `.env.local` and adjust:

```bash
# .env.local
DATABASE_URL=postgresql://openshield:openshield@localhost:5432/openshield
BETTER_AUTH_URL=http://localhost:3000
MANAGER_API_URL=http://localhost:9000

# Default user (seeding)
DEFAULT_USER_EMAIL=admin@example.com
DEFAULT_USER_PASSWORD=password123
DEFAULT_USER_NAME=Admin User
```

### 4. Initialize the database

```bash
curl -X POST http://localhost:3000/api/init-db
```

### 5. Create the admin user

```bash
curl -X POST http://localhost:3000/api/seed
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the configured credentials.

## Project Structure

```
app/
├── agents/                  # Agent list & detail pages
├── dashboard/               # Main dashboard with stats
├── jobs/                    # Job templates
├── tasks/                   # Task execution tracking
├── queries/                 # SQL query CRUD + execution viewer
├── groups/                  # Agent groups
├── bulk-operations/         # Bulk operation tracking
├── admin/                   # User/role/SSO admin panel
├── login/                   # Authentication pages
├── api/                     # Auth, admin, seed API routes
├── layout.tsx               # Root layout with navbar
└── page.tsx                 # Landing page
components/
├── navbar.tsx               # Top navigation with all section links
├── sql-editor.tsx           # SQL editor with schema reference & autocomplete
├── refreshable-section.tsx  # Client wrapper with manual refresh button
├── status-badge.tsx         # Reusable status indicator
├── loading-skeleton.tsx     # Skeleton loaders
├── empty-state.tsx          # Empty state cards
└── error-state.tsx          # Error display with retry
lib/
├── auth.ts                  # Better Auth server config
├── auth-client.ts           # Better Auth client config
├── permissions.ts           # RBAC permission definitions
├── db.ts                    # PostgreSQL pool
├── manager-client.ts        # Typed fetch wrapper for manager API
├── manager-types.ts         # TypeScript interfaces for all models
└── osquery-schema.ts        # osquery table definitions for autocomplete
```

## API Client

All manager API interactions go through `lib/manager-client.ts`, which provides typed functions for every endpoint. Server-side calls go directly to the manager, client-side calls use the Next.js rewrite proxy.

```ts
import { getAgentsList, runQuery, getQueryExecutionsList } from "@/lib/manager-client";

const agents = await getAgentsList();
const execution = await runQuery({ query_id: "uuid", agent_ids: ["uuid"] });
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public dashboard URL |
| `BETTER_AUTH_SECRET` | — | Secret for session encryption |
| `MANAGER_API_URL` | `http://localhost:9000` | Manager API base URL |
| `DEFAULT_USER_EMAIL` | — | Admin email for seeding |
| `DEFAULT_USER_PASSWORD` | — | Admin password for seeding |
| `DEFAULT_USER_NAME` | — | Admin display name for seeding |
| `SMTP_HOST` | — | Email server for verification/password reset |
| `SSO_ROLE_MAP` | `admin=admin` | Maps IdP roles to app roles |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
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
