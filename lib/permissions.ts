import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define the resources and actions available in the system.
 * This is the canonical permission statement used by all roles.
 */
export const statement = {
  user: ["read", "create", "update", "delete"],
  dashboard: ["read"],
  settings: ["read", "update"],
} as const;

const ac = createAccessControl(statement);

/**
 * user role — basic read-only access.
 */
export const user = ac.newRole({
  user: ["read"],
  dashboard: ["read"],
});

/**
 * admin role — full read/write access.
 */
export const admin = ac.newRole({
  user: ["read", "create", "update", "delete"],
  dashboard: ["read"],
  settings: ["read", "update"],
});

/**
 * Export the access controller so auth.ts can use it.
 */
export { ac };
