import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/admin/check-permission?resource=user&action=update
 *
 * Lightweight endpoint for client-side permission checks.
 * Returns { authorized: true/false } based on the current user's roles.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");
  const action = searchParams.get("action");

  if (!resource || !action) {
    return NextResponse.json(
      { error: "resource and action query params are required" },
      { status: 400 }
    );
  }

  const result = await requirePermission({ [resource]: [action] });

  return NextResponse.json({ authorized: result.authorized });
}
