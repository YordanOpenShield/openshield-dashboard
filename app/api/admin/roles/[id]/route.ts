import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * Helper to fetch a role by ID.
 */
async function getRole(id: string) {
  const client = await pgPool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM custom_roles WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/admin/roles/[id]
 *
 * Update a role's name, description, or permissions.
 * Requires `user: ["update"]` permission.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission({ roles: ["update"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissions } = body;

    // Check role exists
    const existing = await getRole(id);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return NextResponse.json(
          { error: "Role name must contain only letters, numbers, hyphens, and underscores" },
          { status: 400 }
        );
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (permissions !== undefined) {
      updates.push(`permissions = $${paramIndex++}`);
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const client = await pgPool.connect();
    try {
      // Check for name conflicts if renaming
      if (name) {
        const existing = await client.query(
          `SELECT id FROM custom_roles WHERE LOWER(name) = LOWER($1) AND id != $2`,
          [name.trim(), id]
        );
        if (existing.rows.length > 0) {
          return NextResponse.json(
            { error: "A role with this name already exists" },
            { status: 409 }
          );
        }
      }

      const result = await client.query(
        `UPDATE custom_roles 
         SET ${updates.join(", ")} 
         WHERE id = $${paramIndex}
         RETURNING id, name, description, permissions, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roles/[id]
 *
 * Delete a role.
 * Requires `user: ["delete"]` permission.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission({ roles: ["delete"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  try {
    const { id } = await params;

    const client = await pgPool.connect();
    try {
      // Check role exists
      const role = await getRole(id);
      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      // Check if any users have this role assigned
      const usersWithRole = await client.query(
        `SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1`,
        [id]
      );

      if (parseInt(usersWithRole.rows[0].count) > 0) {
        return NextResponse.json(
          { error: "Cannot delete role: it is assigned to one or more users" },
          { status: 400 }
        );
      }

      const result = await client.query(
        `DELETE FROM custom_roles WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}
