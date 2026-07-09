/**
 * GET /api/admin/plugins — List all installed plugins
 * POST /api/admin/plugins — Reserved (use /install for actual install)
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { listInstalledPlugins } from "@/lib/plugins";

/**
 * GET /api/admin/plugins
 *
 * List all installed plugins with their status and metadata.
 * Requires `roles: ["list"]` permission.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission({ roles: ["list"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  try {
    const plugins = await listInstalledPlugins();
    return NextResponse.json({ plugins });
  } catch (err: any) {
    console.error("Error listing plugins:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to list plugins" },
      { status: 500 }
    );
  }
}
