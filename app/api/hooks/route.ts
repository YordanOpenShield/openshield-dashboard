/**
 * GET /api/hooks?location=agent-detail-toolbar
 *
 * Returns action hooks registered by plugins for a given UI location.
 * This is called by client-side ActionHookToolbar and ActionHookMenu components.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPluginRegistry } from "@/lib/plugins";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");

  if (!location) {
    return NextResponse.json({ error: "location query parameter is required" }, { status: 400 });
  }

  try {
    const registry = await getPluginRegistry();
    const hooks = await registry.getActionHooks(location as any);
    return NextResponse.json({ hooks });
  } catch (err) {
    console.error("[api/hooks] Error:", err);
    return NextResponse.json({ hooks: [] });
  }
}
