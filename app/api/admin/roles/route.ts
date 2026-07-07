import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * Custom role definition
 */
interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/roles
 *
 * List all roles with their permissions.
 * Requires `user: ["list"]` permission.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission({ roles: ["list"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  const client = await pgPool.connect();
  try {
    const result = await client.query(
      `SELECT id, name, description, permissions, created_at, updated_at 
       FROM custom_roles 
       ORDER BY created_at ASC`
    );

    const roles: CustomRole[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: row.permissions,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ roles });
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch roles" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * POST /api/admin/roles
 *
 * Create a new custom role.
 * Requires `user: ["create"]` permission.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission({ roles: ["create"] });
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    if (!permissions || typeof permissions !== "object") {
      return NextResponse.json({ error: "Permissions object is required" }, { status: 400 });
    }

    // Validate role name format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return NextResponse.json(
        { error: "Role name must contain only letters, numbers, hyphens, and underscores" },
        { status: 400 }
      );
    }

    const client = await pgPool.connect();
    try {
      // Check if role name already exists
      const existing = await client.query(
        `SELECT id FROM custom_roles WHERE LOWER(name) = LOWER($1)`,
        [name.trim()]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 409 }
        );
      }

      const result = await client.query(
        `INSERT INTO custom_roles (name, description, permissions) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, description, permissions, created_at, updated_at`,
        [name.trim(), description || null, JSON.stringify(permissions)]
      );

      const role: CustomRole = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        permissions: result.rows[0].permissions,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      };

      return NextResponse.json(role, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create role" },
      { status: 500 }
    );
  }
}
