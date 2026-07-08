/**
 * DELETE /api/admin/plugins/[pluginId] — Uninstall a plugin
 * PATCH  /api/admin/plugins/[pluginId] — Update plugin (toggle enabled)
 */

import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { uninstallPlugin } from "@/lib/plugins";

interface RouteProps {
  params: Promise<{ pluginId: string }>;
}

/**
 * DELETE /api/admin/plugins/[pluginId]
 *
 * Uninstall a plugin: remove files, drop DB entries, run rollback migrations.
 * Requires `roles: ["delete"]` permission.
 */
export async function DELETE(request: NextRequest, props: RouteProps) {
  const auth = await requirePermission({ roles: ["delete"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  const { pluginId } = await props.params;

  try {
    const result = await uninstallPlugin(pluginId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Uninstall failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: `Plugin "${pluginId}" uninstalled successfully` },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`Plugin uninstall error for "${pluginId}":`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to uninstall plugin" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/plugins/[pluginId]
 *
 * Update plugin properties (e.g., toggle enabled/disabled).
 * Requires `roles: ["update"]` permission.
 */
export async function PATCH(request: NextRequest, props: RouteProps) {
  const auth = await requirePermission({ roles: ["update"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  const { pluginId } = await props.params;

  try {
    const body = await request.json();
    const { enabled } = body;

    if (enabled !== undefined) {
      const client = await pgPool.connect();
      try {
        await client.query(
          `UPDATE plugin_registry SET enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [enabled, pluginId]
        );
      } finally {
        client.release();
      }
    }

    return NextResponse.json(
      { message: `Plugin "${pluginId}" updated successfully` },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`Plugin update error for "${pluginId}":`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to update plugin" },
      { status: 500 }
    );
  }
}
