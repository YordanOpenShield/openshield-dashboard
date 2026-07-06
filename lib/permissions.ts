import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define the resources and actions available in the system.
 * The action names MUST match what the admin plugin checks internally.
 * See: node_modules/better-auth/dist/plugins/admin/access/statement.mjs
 */
export const statement = {
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
  session: ["list", "revoke", "delete"],
  dashboard: ["read"],
  settings: ["read", "update"],
} as const;

const ac = createAccessControl(statement);

/**
 * user role — basic read-only access.
 */
export const user = ac.newRole({
  user: ["get", "list"],
  dashboard: ["read"],
});

/**
 * admin role — full read/write access to everything.
 */
export const admin = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
  dashboard: ["read"],
  settings: ["read", "update"],
});

/**
 * Export the access controller so auth.ts can use it.
 */
export { ac };
