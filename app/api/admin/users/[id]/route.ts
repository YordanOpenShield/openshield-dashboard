import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * PATCH /api/admin/users/[id]
 *
 * Update a user's name, email, and/or role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermission({ user: ["update"] });
  if (!perm.authorized) {
    return NextResponse.json({ error: perm.error }, { status: perm.status! });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, banned, banReason } = body;

    const client = await pgPool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
      if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
      if (role !== undefined) { updates.push(`role = $${idx++}`); values.push(role); }
      if (banned !== undefined) { updates.push(`banned = $${idx++}`); values.push(banned); }
      if (banReason !== undefined) { updates.push(`ban_reason = $${idx++}`); values.push(banReason); }

      if (updates.length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await client.query(
        `UPDATE "user" SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, email, email_verified as "emailVerified", name, role, created_at as "createdAt", updated_at as "updatedAt", banned, ban_reason as "banReason"`,
        values
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Delete a user and all their sessions/accounts.
 * Requires `user: ["delete"]` permission.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perm = await requirePermission({ user: ["delete"] });
  if (!perm.authorized) {
    return NextResponse.json({ error: perm.error }, { status: perm.status! });
  }

  try {
    const { id } = await params;

    const client = await pgPool.connect();
    try {
      // Check user exists
      const userResult = await client.query(`SELECT id FROM "user" WHERE id = $1`, [id]);
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Delete sessions, accounts, and the user (CASCADE should handle this,
      // but we do it explicitly for clarity)
      await client.query(`DELETE FROM session WHERE "userId" = $1`, [id]);
      await client.query(`DELETE FROM account WHERE "userId" = $1`, [id]);
      await client.query(`DELETE FROM "user" WHERE id = $1`, [id]);

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
