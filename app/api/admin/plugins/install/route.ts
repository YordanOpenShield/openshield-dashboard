/**
 * POST /api/admin/plugins/install
 *
 * Install a plugin from an uploaded zip archive.
 * Requires `roles: ["create"]` permission.
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { installPluginFromZip } from "@/lib/plugins/loader";

export async function POST(request: NextRequest) {
  const auth = await requirePermission({ roles: ["create"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("plugin");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No plugin file uploaded. Use field name 'plugin'." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Plugin must be a .zip file" },
        { status: 400 }
      );
    }

    // Read the file into a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Install the plugin
    const result = await installPluginFromZip(buffer, file.name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Installation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Plugin installed successfully",
        pluginId: result.pluginId,
        name: result.pluginId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Plugin install error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to install plugin" },
      { status: 500 }
    );
  }
}
