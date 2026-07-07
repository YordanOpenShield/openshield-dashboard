import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/admin/users/[id]/roles
 *
 * Get all roles assigned to a user.
 * Requires `user: ["list"]` permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requirePermission({ user: ["list"] });
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status! });
  }

  try {
    const { id } = await params;

    const client = await pgPool.connect();
    try {
      // Get the user's built-in role from the user table
      const userResult = await client.query(
        `SELECT role FROM "user" WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const builtInRole = userResult.rows[0].role;

      // Get custom roles assigned to the user
      const customRolesResult = await client.query(
        `SELECT cr.id, cr.name, cr.description, cr.permissions
         FROM custom_roles cr
         INNER JOIN user_roles ur ON cr.id = ur.role_id
         WHERE ur.user_id = $1`,
        [id]
      );

      return NextResponse.json({
        userId: id,
        builtInRole,
        customRoles: customRolesResult.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/roles
 *
 * Assign a custom role to a user.
 * Also appends the role name to the user's role column (comma-separated)
 * so the RBAC engine recognizes it.
 * Requires `user: ["update"]` permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requirePermission({ user: ["update"] });
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status! });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const client = await pgPool.connect();
    try {
      // Verify user exists and get current role
      const userResult = await client.query(
        `SELECT id, role FROM "user" WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify role exists and get its name
      const roleResult = await client.query(
        `SELECT id, name FROM custom_roles WHERE id = $1`,
        [roleId]
      );

      if (roleResult.rows.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      // Check if already assigned
      const existingResult = await client.query(
        `SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`,
        [id, roleId]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          { error: "Role is already assigned to this user" },
          { status: 409 }
        );
      }

      // Assign the role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [id, roleId]
      );

      // Sync the role name into user.role column (comma-separated)
      // so the RBAC engine recognizes it alongside any other roles.
      const currentRole = (userResult.rows[0].role ?? "").trim();
      const roleName = roleResult.rows[0].name;
      const roles = currentRole
        ? currentRole.split(",").map((r: string) => r.trim()).filter(Boolean)
        : [];
      if (!roles.includes(roleName)) {
        roles.push(roleName);
        await client.query(
          `UPDATE "user" SET role = $1 WHERE id = $2`,
          [roles.join(","), id]
        );
      }

      return NextResponse.json({ success: true }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to assign role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/roles
 *
 * Remove a custom role from a user.
 * Also removes the role name from the user's role column.
 * Requires `user: ["update"]` permission.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requirePermission({ user: ["update"] });
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status! });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const client = await pgPool.connect();
    try {
      // Get the role name before deleting the assignment
      const roleResult = await client.query(
        `SELECT name FROM custom_roles WHERE id = $1`,
        [roleId]
      );
      if (roleResult.rows.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      const roleName = roleResult.rows[0].name;

      // Delete the assignment
      const result = await client.query(
        `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING id`,
        [id, roleId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Role assignment not found" },
          { status: 404 }
        );
      }

      // Remove the role name from user.role column
      const userResult = await client.query(
        `SELECT role FROM "user" WHERE id = $1`,
        [id]
      );
      if (userResult.rows.length > 0) {
        const currentRole = (userResult.rows[0].role ?? "").trim();
        const roles = currentRole
          ? currentRole.split(",").map((r: string) => r.trim()).filter((r: string) => r !== roleName && r.length > 0)
          : [];
        await client.query(
          `UPDATE "user" SET role = $1 WHERE id = $2`,
          [roles.join(","), id]
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error removing role:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove role" },
      { status: 500 }
    );
  }
}
