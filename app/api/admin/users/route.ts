import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/admin/users
 *
 * List all users with optional search, pagination, and sorting.
 * Uses requirePermission (DB-first) for authorization, then queries
 * the database directly instead of relying on the cached admin plugin.
 */
export async function GET(request: NextRequest) {
  const perm = await requirePermission({ user: ["list"] });
  if (!perm.authorized) {
    return NextResponse.json({ error: perm.error }, { status: perm.status! });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const searchValue = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortDirection = (searchParams.get("sortDirection") ?? "desc") as "asc" | "desc";

    const client = await pgPool.connect();
    try {
      let whereClause = "";
      const params: any[] = [];
      let paramIdx = 1;

      if (searchValue) {
        whereClause = `WHERE (email ILIKE $${paramIdx} OR name ILIKE $${paramIdx})`;
        params.push(`%${searchValue}%`);
        paramIdx++;
      }

      const orderClause = `ORDER BY "${sortBy}" ${sortDirection === "desc" ? "DESC" : "ASC"}`;

      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM "user" ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      const dataResult = await client.query(
        `SELECT id, email, "emailVerified", name, image, role, "createdAt", "updatedAt", banned, "banReason", "banExpires" FROM "user" ${whereClause} ${orderClause} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      );

      return NextResponse.json({
        users: dataResult.rows,
        total,
        limit,
        offset,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error listing users:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 *
 * Create a new user with email, password, name, and optional role.
 * Uses better-auth's built-in admin plugin (createUser endpoint).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const response = await auth.api.createUser({
      headers: await headers(),
      body: {
        name,
        email,
        password,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);

    const statusCode = error?.statusCode ?? error?.status;
    if (statusCode === 403 || statusCode === 401) {
      return NextResponse.json(
        { error: error?.body?.message || "Unauthorized. Admin access required." },
        { status: statusCode }
      );
    }

    // Handle duplicate email
    if (
      error?.message?.includes("already exists") ||
      error?.code === "USER_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error?.body?.message || error?.message || "Failed to create user" },
      { status: statusCode || 500 }
    );
  }
}
