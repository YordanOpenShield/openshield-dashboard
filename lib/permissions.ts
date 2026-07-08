import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define the resources and actions available in the system.
 *
 * Resources map to admin sections:
 *   user/session — users admin page (names match admin plugin internals)
 *   roles        — roles admin page
 *   sso          — SSO settings admin page
 *   dashboard    — basic dashboard access
 *
 * The admin plugin internally checks user: and session: actions.
 * roles: and sso: are used by our custom CRUD APIs.
 */
export const statement = {
  // Admin plugin internal checks (users page + session management)
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke"],

  // Custom admin section resources
  roles: ["list", "create", "update", "delete"],
  sso: ["read", "update"],

  // Basic access
  dashboard: ["read"],
} as const;

/**
 * The access controller — defines what resources and actions exist.
 * Custom roles are built from this via the admin UI and stored in the DB.
 */
export const ac = createAccessControl(statement);

/**
 * Load all role definitions from the custom_roles table.
 * Returns null if the table doesn't exist yet or the DB isn't reachable
 * (e.g. during build).
 */
export async function loadRolesFromDb(): Promise<Record<string, ReturnType<typeof ac.newRole>> | null> {
  try {
    const { pgPool } = await import("./db");
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT name, permissions FROM custom_roles`
      );
      if (result.rows.length === 0) return null;
      const roles: Record<string, ReturnType<typeof ac.newRole>> = {};
      for (const row of result.rows) {
        roles[row.name] = ac.newRole(row.permissions);
      }
      return roles;
    } finally {
      client.release();
    }
  } catch {
    return null;
  }
}

/**
 * Check whether the current request's user has a specific permission.
 * Uses better-auth's admin plugin internally.
 *
 * Usage in API routes:
 *   const { authorized } = await requirePermission({ user: ["list"] });
 *   if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 */
export async function requirePermission(
  permission: Record<string, string[]>,
  headers?: Headers
): Promise<{ authorized: boolean; session?: any; error?: string; status?: number }> {
  try {
    const { auth } = await import("./auth");
    const hdrs = headers ?? await (await import("next/headers")).headers();
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) return { authorized: false, error: "Unauthorized", status: 401 };

    const userRoles = ((session.user as any).role ?? "").split(",").map((r: string) => r.trim()).filter(Boolean);
    const resource = Object.keys(permission)[0];
    const actions = permission[resource];
    if (!resource || !actions) return { authorized: false, error: "Forbidden", status: 403 };

    // Try direct DB check first (picks up recently created/modified roles immediately)
    if (userRoles.length > 0) {
      try {
        const dbRoles = await loadRolesFromDb();
        if (dbRoles) {
          for (const roleName of userRoles) {
            const role = dbRoles[roleName];
            if (role) {
              const check = role.authorize({ [resource]: actions });
              if (check?.success) return { authorized: true, session };
            }
          }
          // DB had roles but none matched — don't bother with cached
          return { authorized: false, error: "Forbidden", status: 403 };
        }
      } catch {
        // DB unavailable — fall through to cached check
      }
    }

    // Fallback: cached auth check
    const result = await auth.api.userHasPermission({
      headers: hdrs,
      body: { permissions: permission },
    });

    if (!result?.success) return { authorized: false, error: "Forbidden", status: 403 };
    return { authorized: true, session };
  } catch {
    return { authorized: false, error: "Forbidden", status: 403 };
  }
}

/**
 * Check if the user has ANY admin-level permission.
 * The admin section (navbar link, layout) should show if this returns true.
 * Checks across all resources that are considered "admin" (user, session, settings).
 * If the user has any action on any of these resources, they get admin access.
 */
export async function hasAnyAdminPermission(
  headers?: Headers
): Promise<boolean> {
  const hdrs = headers ?? await (await import("next/headers")).headers();
  const { auth } = await import("./auth");
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) return false;

  const userRoles = ((session.user as any).role ?? "").split(",").map((r: string) => r.trim()).filter(Boolean);
  if (userRoles.length === 0) return false;

  // Admin resources and actions to check — covers users, roles, sessions, and SSO.
  // dashboard: ["read"] is NOT included — it's basic access, not admin.
  const adminCheckList: Record<string, string[]>[] = [
    { user: ["list"] },
    { user: ["create"] },
    { roles: ["list"] },
    { session: ["list"] },
    { sso: ["read"] },
  ];

  // Try direct DB check first (picks up recently created/modified roles immediately)
  try {
    const dbRoles = await loadRolesFromDb();
    if (dbRoles) {
      for (const perm of adminCheckList) {
        const resource = Object.keys(perm)[0];
        const actions = perm[resource];
        if (!resource || !actions) continue;

        for (const roleName of userRoles) {
          const role = dbRoles[roleName];
          if (role) {
            const check = role.authorize({ [resource]: actions });
            if (check?.success) return true;
          }
        }
      }
      // DB had roles but none matched — don't bother with cached check
      return false;
    }
  } catch {
    // DB unavailable — fall through to cached check below
  }

  // Fallback: cached auth check (uses role definitions loaded at startup)
  const results = await Promise.all(
    adminCheckList.map((perm) =>
      auth.api.userHasPermission({
        headers: hdrs,
        body: { permissions: perm },
      }).then((r: any) => r?.success === true).catch(() => false)
    )
  );

  return results.some(Boolean);
}
