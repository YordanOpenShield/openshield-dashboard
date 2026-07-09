/**
 * GET  /api/admin/plugins/[pluginId]/settings — Get plugin settings
 * PATCH /api/admin/plugins/[pluginId]/settings — Update plugin settings
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getPluginConfig, updatePluginConfig } from "@/lib/plugins";

interface RouteProps {
  params: Promise<{ pluginId: string }>;
}

/**
 * GET /api/admin/plugins/[pluginId]/settings
 *
 * Returns the current settings for a plugin.
 */
export async function GET(request: NextRequest, props: RouteProps) {
  const auth = await requirePermission({ roles: ["read"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  const { pluginId } = await props.params;
  const settings = await getPluginConfig(pluginId);
  return NextResponse.json({ settings });
}

/**
 * PATCH /api/admin/plugins/[pluginId]/settings
 *
 * Updates the settings for a plugin.
 */
export async function PATCH(request: NextRequest, props: RouteProps) {
  const auth = await requirePermission({ roles: ["update"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  const { pluginId } = await props.params;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Settings must be a JSON object" },
        { status: 400 }
      );
    }

    await updatePluginConfig(pluginId, settings);

    return NextResponse.json(
      { message: "Settings updated successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`Plugin settings error for "${pluginId}":`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
