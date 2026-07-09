import { NextRequest, NextResponse } from "next/server";
import { getPluginRegistry } from "@/lib/plugins";
import { requirePermission } from "@/lib/permissions";

/**
 * Core permission resources always available in the system.
 * These are the built-in resources from lib/permissions.ts.
 */
const CORE_PERMISSIONS: Record<string, string[]> = {
  user: [
    "create", "list", "get", "update", "delete", "set-role",
    "ban", "impersonate", "impersonate-admins", "set-password", "set-email",
  ],
  session: ["list", "revoke"],
  roles: ["list", "create", "update", "delete"],
  sso: ["read", "update"],
  dashboard: ["read"],
};

/**
 * GET /api/admin/permissions
 *
 * Returns all available permission resources and their actions.
 * Merges core permissions with plugin-declared permissions.
 * Used by the admin roles page to render the permission editor.
 *
 * Requires `roles: ["list"]` permission.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission({ roles: ["list"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  // Get plugin-declared permissions
  const registry = await getPluginRegistry();
  const pluginPermissions = await registry.getPluginPermissions();

  // Merge: start with core, add plugin permissions
  const merged: Record<string, string[]> = { ...CORE_PERMISSIONS };
  for (const [resource, actions] of Object.entries(pluginPermissions)) {
    if (merged[resource]) {
      // Merge unique actions
      for (const action of actions) {
        if (!merged[resource].includes(action)) {
          merged[resource].push(action);
        }
      }
    } else {
      merged[resource] = [...actions];
    }
  }

  return NextResponse.json({ resources: merged });
}
