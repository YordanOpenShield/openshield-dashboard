import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
    // Create default user using Better Auth API
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    return NextResponse.json(
      {
        message: "Default user created successfully",
        user: {
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating default user:", error);
    
    // Check for specific error types
    if (
      error?.message?.includes("already exists") ||
      error?.message?.includes("unique constraint") ||
      error?.code === "23505"
    ) {
      return NextResponse.json(
        { message: "Default user already exists" },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to create default user" },
      { status: 500 }
    );
  }
}
