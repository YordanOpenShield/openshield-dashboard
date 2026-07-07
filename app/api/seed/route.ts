import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pgPool } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seeding not allowed in production" },
      { status: 403 }
    );
  }

  const email = process.env.DEFAULT_USER_EMAIL;
  const password = process.env.DEFAULT_USER_PASSWORD;
  const name = process.env.DEFAULT_USER_NAME;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Default user credentials not configured in environment" },
      { status: 500 }
    );
  }

  try {
    const client = await pgPool.connect();
    try {
      // 1. Ensure the "admin" role definition exists in custom_roles
      const existingRole = await client.query(
        `SELECT id FROM custom_roles WHERE name = 'admin'`
      );

      if (existingRole.rows.length === 0) {
        await client.query(
          `INSERT INTO custom_roles (name, description, permissions) VALUES ($1, $2, $3)`,
          [
            "admin",
            "Full administrative access. Complete control over users, roles, sessions, SSO, and dashboard.",
            JSON.stringify({
              user: [
                "create", "list", "set-role", "ban", "impersonate",
                "delete", "set-password", "set-email", "get", "update",
              ],
              session: ["list", "revoke"],
              roles: ["list", "create", "update", "delete"],
              sso: ["read", "update"],
              dashboard: ["read"],
            }),
          ]
        );
      }

      // 2. Create default user
      const result = await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        },
      });

      // 3. Assign the admin role
      await client.query(
        `UPDATE "user" SET role = 'admin' WHERE id = $1`,
        [result.user.id]
      );

      return NextResponse.json(
        {
          message: "Default user created successfully",
          user: {
            email: result.user.email,
            name: result.user.name,
            role: "admin",
          },
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating default user:", error);

    // Check for specific error types
    if (
      error?.message?.includes("already exists") ||
      error?.message?.includes("unique constraint") ||
      error?.code === "23505"
    ) {
      // User exists — ensure admin role definition exists and is assigned
      const client = await pgPool.connect();
      try {
        // Ensure admin role definition exists
        const existingRole = await client.query(
          `SELECT id FROM custom_roles WHERE name = 'admin'`
        );
        if (existingRole.rows.length === 0) {
          await client.query(
            `INSERT INTO custom_roles (name, description, permissions) VALUES ($1, $2, $3)`,
            [
              "admin",
              "Full administrative access.",
              JSON.stringify({
                user: [
                  "create", "list", "set-role", "ban", "impersonate",
                  "delete", "set-password", "set-email", "get", "update",
                ],
                session: ["list", "revoke"],
                roles: ["list", "create", "update", "delete"],
                sso: ["read", "update"],
                dashboard: ["read"],
              }),
            ]
          );
        }
        // Assign the admin role
        await client.query(
          `UPDATE "user" SET role = 'admin' WHERE email = $1`,
          [email]
        );
      } finally {
        client.release();
      }
      return NextResponse.json(
        { message: "Default user already exists, admin role assigned" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create default user", details: error?.cause || error?.stack },
      { status: 500 }
    );
  }
}
