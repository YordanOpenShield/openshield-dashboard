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

RBAC uses `better-auth`'s `admin` plugin with `createAccessControl` for authorization. Two roles are defined in `lib/permissions.ts`:

| Role | Permissions |
|------|-------------|
| `user` | Read access to users and dashboard |
| `admin` | Full CRUD on users, read dashboard, read/update settings |

### Permission Definitions (`lib/permissions.ts`)

```ts
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  user: ["read", "create", "update", "delete"],
  dashboard: ["read"],
  settings: ["read", "update"],
};

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  user: ["create", "read", "update", "delete"],
  dashboard: ["read"],
  settings: ["read", "update"],
});

export const user = ac.newRole({
  user: ["read"],
  dashboard: ["read"],
  settings: [],
});
```

### Server-Side Permission Checking

Use `auth.api.hasPermission()` to check permissions in server components or API routes:

```ts
const admin = await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permission: {
      user: ["create"],
    },
  },
});
```

### Client-Side Permission Checking

Use `authClient.admin.hasPermission()` to check permissions from client components:

```ts
const canCreate = await authClient.admin.hasPermission({
  permission: {
    user: ["create"],
  },
});
```

### Role Checking in Components

Access the user's role from the session object:

```ts
const session = await auth.api.getSession({ headers: await headers() });
const role = (session.user as any).role ?? "user";
const isAdmin = role === "admin" || role === "owner";
```

### Seed Script

The seed endpoint (`app/api/seed/route.ts`) creates the default user with `role: "admin"` via `auth.api.signUpEmail()` (cast with `as any` to bypass TypeScript — the admin plugin handles it at runtime).

### DB Migration

After enabling the admin plugin, run the migration to add the `role` column to the user table:

```bash
npx auth migrate
```
