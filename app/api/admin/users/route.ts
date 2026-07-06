import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/admin/users
 *
 * List all users with optional search, pagination, and sorting.
 * Uses better-auth's built-in admin plugin (listUsers endpoint)
 * which enforces RBAC authorization automatically.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "20";
    const offset = searchParams.get("offset") ?? "0";
    const searchValue = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortDirection = (searchParams.get("sortDirection") ?? "desc") as "asc" | "desc";

    const response = await auth.api.listUsers({
      headers: await headers(),
      query: {
        limit,
        offset,
        searchValue,
        searchField: searchValue ? "email" : undefined,
        searchOperator: searchValue ? "contains" : undefined,
        sortBy,
        sortDirection,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error listing users:", error);

    // better-auth admin plugin uses statusCode for numeric HTTP status
    const statusCode = error?.statusCode ?? error?.status;
    if (statusCode === 403 || statusCode === 401) {
      return NextResponse.json(
        { error: error?.body?.message || "Unauthorized. Admin access required." },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.body?.message || error?.message || "Failed to list users" },
      { status: statusCode || 500 }
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
    const { name, email, password, role } = body;

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
        role: role || "user",
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
