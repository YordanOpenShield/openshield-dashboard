Don't include `^U` in your commands.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# OpenShield Dashboard - AI Coding Guidelines

These guidelines ensure consistent code quality, styling, and architecture across all AI-generated contributions.

---

## 1. Design System & Styling

### Core Aesthetic: Cursor-Inspired Dark UI

- Dark-first interface with premium AI-tool aesthetic
- Glassmorphism layers for depth (`bg-[#111111]/80 backdrop-blur-md border border-white/10`)
- Gradient accents for interactive elements (`from-violet-500 to-blue-500`)
- Subtle borders and shadows for hierarchy

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0a` | Main page background |
| `--bg-secondary` | `#111111` | Card/section backgrounds |
| `--bg-tertiary` | `#0d0d0d` | Elevated surfaces |
| `--border-default` | `rgba(255,255,255,0.1)` | Default borders |
| `--border-hover` | `rgba(255,255,255,0.2)` | Hover borders |
| `--text-primary` | `#ededed` | Headings |
| `--text-secondary` | `#a1a1a1` | Body text |
| `--text-muted` | `#737373` | Placeholders/hints |
| `--accent-from` | `#8b5cf6` | Gradient start (violet-500) |
| `--accent-to` | `#3b82f6` | Gradient end (blue-500) |
| `--success` | `#22c55e` | Success states |
| `--error` | `#ef4444` | Error states |

### Tailwind CSS v4 Patterns

**Glassmorphism Card:**
```tsx
<div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg">
```

**Gradient Text:**
```tsx
<h1 className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
```

**Gradient Button (Primary):**
```tsx
<button className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium px-4 py-2 rounded-md transition-all duration-200">
```

**Ghost Button (Secondary):**
```tsx
<button className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-all duration-200">
```

**Input Field:**
```tsx
<input className="bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200">
```

**Focus Rings:**
```tsx
className="focus:outline-none focus:ring-2 focus:ring-violet-500/50"
```

---

## 2. TypeScript & Code Patterns

### Strict Typing

- Use explicit return types on exported functions
- Define interfaces for props, API responses, data structures
- Use `type` for unions, `interface` for object shapes
- Avoid `any` — use `unknown` with type guards

### Async/Await Patterns

- Always use `async/await` over raw promises
- Use `try/catch` for error handling
- Type error variables explicitly

### Import Conventions

- Use `@/` path aliases
- Group: React/Next → Third-party → Local
- Prefer named imports

---

## 3. Next.js App Router Conventions

### Server vs Client Components

**Default to Server Components** unless you need browser APIs, React hooks, or event handlers.

```tsx
'use client';  // Only when needed
```

### Data Fetching

```tsx
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  return <Dashboard user={session.user} />;
}
```

### Navigation

- `next/link` for client navigation
- `redirect()` from `next/navigation` for server redirects

---

## 4. Common Patterns Checklist

When generating code, ensure:
- **Dark theme first** — All new UI uses dark color palette
- **Glassmorphism** — Cards use `bg-[#111111]/80 backdrop-blur-md border border-white/10`
- **Gradient accents** — Primary actions use `from-violet-500 to-blue-500`
- **Smooth transitions** — All interactive elements have `transition-all duration-200`
- **Focus rings** — Inputs/buttons have `focus:ring-2 focus:ring-violet-500/50`
- **Type safety** — All functions have explicit return types
- **Server-first** — Components are server components unless browser APIs needed

---

## 5. Build & Development

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint check |

---

## 6. SSO (Single Sign-On) Patterns

### Architecture

SSO is handled by the `@better-auth/sso` plugin. Providers (OIDC or SAML) are registered dynamically at runtime — there's no hardcoded list.

### Registering an OIDC Provider

```ts
import { authClient } from "@/lib/auth-client";

await authClient.sso.register({
  providerId: "okta",
  issuer: "https://your-org.okta.com",
  domain: "yourcompany.com",
  oidcConfig: {
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    scopes: ["openid", "email", "profile"],
    pkce: true,
    mapping: {
      id: "sub",
      email: "email",
      emailVerified: "email_verified",
      name: "name",
      image: "picture",
    },
  },
});
```

### Registering a SAML Provider

```ts
import { authClient } from "@/lib/auth-client";

await authClient.sso.register({
  providerId: "saml-provider",
  issuer: "https://idp.example.com",
  domain: "example.com",
  samlConfig: {
    entryPoint: "https://idp.example.com/sso",
    cert: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    callbackUrl: "https://yourapp.com/api/auth/sso/saml2/sp/acs/saml-provider",
    mapping: {
      id: "nameID",
      email: "email",
      name: "displayName",
    },
  },
});
```

### SSO Sign-In Flow

SSO sign-in happens client-side via `authClient.signIn.sso()`:

```ts
// Auto-detect provider by email domain
await authClient.signIn.sso({
  email: "user@company.com",
  callbackURL: "/dashboard",
});

// Or sign in with a specific provider ID
await authClient.signIn.sso({
  providerId: "okta",
  callbackURL: "/dashboard",
});
```

The login page at `/login` has a dedicated "Continue with SSO" form below the email/password fields. Users enter their company email, and the system redirects them to the appropriate identity provider based on the email domain.

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/sso/register` | Register a new SSO provider |
| `POST /api/auth/sign-in/sso` | Initiate SSO sign-in |
| `GET/POST /api/auth/sso/saml2/callback/[providerId]` | SAML callback (IdP-initiated) |
| `GET /api/auth/sso/saml2/sp/metadata?providerId=` | Get SP metadata XML |

---

## 7. RBAC (Role-Based Access Control)

### Architecture

All roles are **permission wrappers** stored in the `custom_roles` database table. There are no hardcoded built-in roles — even `user` and `admin` are regular DB rows, fully editable and deletable through the admin UI.

- **Role definitions** live in `custom_roles` table (name, description, permissions JSONB)
- **Role assignments** are stored in the `user.role` column as comma-separated role names (e.g. `"admin"`, `"admin,moderator"`)
- **Role definitions load at server startup** from the DB — changes require a restart to take effect
- **New users** get the `defaultRole` ("user") assigned automatically

### Available Resources & Actions

Defined in `lib/permissions.ts`:

| Resource | Actions | Purpose |
|----------|---------|---------|
| `user` | `create`, `list`, `get`, `update`, `delete`, `set-role`, `ban`, `impersonate`, `impersonate-admins`, `set-password`, `set-email` | User management (admin plugin internal) |
| `session` | `list`, `revoke` | Session management (admin plugin internal) |
| `roles` | `list`, `create`, `update`, `delete` | Role management |
| `sso` | `read`, `update` | SSO provider management |
| `dashboard` | `read` | Dashboard access |

### Server-Side Permission Checking

Use `requirePermission()` from `@/lib/permissions` in API routes and server components:

```ts
import { requirePermission } from "@/lib/permissions";

const auth = await requirePermission({ user: ["list"] });
if (!auth.authorized) {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}
```

Or inline in server components:

```ts
const perm = await requirePermission({ settings: ["read"] }, await headers());
if (!perm.authorized) redirect("/dashboard");
```

### Gating UI Elements by Permissions

The admin layout (`app/admin/layout.tsx`) checks for **either** `user: ["list"]` **or** `settings: ["read"]` to grant entry. The sidebar nav (`components/admin-sidebar-nav.tsx`) filters nav items based on the user's specific permissions:

- **Users** & **Roles** pages → requires `user: ["list"]`
- **SSO Settings** page → requires `settings: ["read"]`

The navbar (`components/navbar.tsx`) shows the "Admin" link when the user has either `user: ["list"]` or `settings: ["read"]`.

### Creating Roles

Roles are created via the admin UI at `/admin/roles`. Each role bundles a set of resource → action pairs. When a role is assigned to a user, they gain the union of all permissions from all their roles.

### Seeded Roles

`POST /api/init-db` seeds two default roles (idempotent — they won't overwrite existing ones):

| Role | Permissions |
|------|-------------|
| `user` | `dashboard: ["read"]` |
| `admin` | `user: [all actions]`, `session: [list, revoke]`, `dashboard: ["read"]`, `settings: ["read", "update"]` |

`POST /api/seed` additionally creates the `admin` role definition if missing and assigns it to the default admin user.

### Key Files

| File | Purpose |
|------|---------|
| `lib/permissions.ts` | Permission statement, `ac`, `loadRolesFromDb()`, `requirePermission()` |
| `lib/auth.ts` | Loads roles from DB, configures admin plugin with `defaultRole: "user"` |
| `app/api/admin/roles/*` | CRUD API for role definitions |
| `app/api/admin/users/[id]/roles` | Assign/remove roles for a user, syncs to `user.role` column |

---
