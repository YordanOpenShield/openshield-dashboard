import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/admin/users/[id]/sessions
 *
 * List all active sessions for a user.
 * Uses better-auth's admin plugin (listUserSessions endpoint)
 * which enforces `session: ["list"]` permission internally.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermission({ session: ["list"] });
  if (!perm.authorized) {
    return NextResponse.json({ error: perm.error }, { status: perm.status! });
  }

  try {
    const { id } = await params;

    const client = await pgPool.connect();
    try {
      const { rows } = await client.query(
        `SELECT id, "userId", token, "createdAt", "updatedAt", "expiresAt", "ipAddress", "userAgent", "impersonatedBy" FROM session WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
        [id]
      );
      return NextResponse.json({ sessions: rows });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error listing user sessions:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list sessions" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/sessions
 *
 * Revoke a specific session. Requires `sessionToken` query param.
 * Uses better-auth's admin plugin (revokeUserSession endpoint).
 *
 * POST /api/admin/users/[id]/sessions?revokeAll=true
 *
 * Revoke all sessions for a user.
 * Uses better-auth's admin plugin (revokeUserSessions endpoint).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermission({ session: ["revoke"] });
  if (!perm.authorized) {
    return NextResponse.json({ error: perm.error }, { status: perm.status! });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get("sessionToken");
    const revokeAll = searchParams.get("revokeAll") === "true";

    const client = await pgPool.connect();
    try {
      if (revokeAll) {
        await client.query(`DELETE FROM session WHERE "userId" = $1`, [id]);
        return NextResponse.json({ success: true });
      }

      if (!sessionToken) {
        return NextResponse.json({ error: "sessionToken query param is required" }, { status: 400 });
      }

      const result = await client.query(`DELETE FROM session WHERE token = $1 RETURNING id`, [sessionToken]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to revoke session" },
      { status: 500 }
    );
  }
}
