import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not allowed in production" },
      { status: 403 }
    );
  }

  const client = await pgPool.connect();

  try {
    // Create extension for UUID
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Create Better Auth tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        name VARCHAR(255),
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        access_token_expires_at TIMESTAMP WITH TIME ZONE,
        refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
        scope TEXT,
        id_token TEXT,
        password TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, provider_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json(
      { message: "Database initialized successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize database" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
