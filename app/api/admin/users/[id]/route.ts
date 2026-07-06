import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * PATCH /api/admin/users/[id]
 *
 * Update a user's name, email, and/or role.
 * Uses better-auth's built-in admin plugin (adminUpdateUser endpoint).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role } = body;

    // Build update data — only include provided fields
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const response = await auth.api.adminUpdateUser({
      headers: await headers(),
      body: {
        userId: id,
        data,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error updating user:", error);

    // better-auth admin plugin uses statusCode for numeric HTTP status
    const statusCode = error?.statusCode ?? error?.status;
    if (statusCode === 403 || statusCode === 401) {
      return NextResponse.json(
        { error: error?.body?.message || "Unauthorized. Admin access required." },
        { status: statusCode }
      );
    }

    if (statusCode === 404) {
      return NextResponse.json(
        { error: error?.body?.message || "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error?.body?.message || error?.message || "Failed to update user" },
      { status: statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Delete a user and all their sessions/accounts.
 * Uses better-auth's built-in admin plugin (removeUser endpoint).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await auth.api.removeUser({
      headers: await headers(),
      body: {
        userId: id,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error deleting user:", error);

    const statusCode = error?.statusCode ?? error?.status;
    if (statusCode === 403 || statusCode === 401) {
      return NextResponse.json(
        { error: error?.body?.message || "Unauthorized. Admin access required." },
        { status: statusCode }
      );
    }

    if (statusCode === 404) {
      return NextResponse.json(
        { error: error?.body?.message || "User not found" },
        { status: 404 }
      );
    }

    if (error?.message?.includes("cannot remove yourself")) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
