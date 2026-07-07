import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * PATCH /api/admin/sso/providers/[providerId]
 *
 * Update an SSO provider's configuration.
 * Bypasses the built-in userId ownership check so any admin can
 * manage providers registered by other admins.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const perm = await requirePermission({ sso: ["update"] }, await headers());
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const { providerId } = await params;
    const body = await request.json();

    const client = await pgPool.connect();
    try {
      const { rows: existing } = await client.query(
        `SELECT * FROM "ssoProvider" WHERE "providerId" = $1`,
        [providerId]
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Provider not found" },
          { status: 404 }
        );
      }

      // Parse existing configs
      const currentOidc = existing[0].oidcConfig
        ? JSON.parse(existing[0].oidcConfig)
        : {};
      const currentSaml = existing[0].samlConfig
        ? JSON.parse(existing[0].samlConfig)
        : {};

      // Build dynamic UPDATE SET
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (body.issuer !== undefined) {
        updates.push(`"issuer" = $${idx++}`);
        values.push(body.issuer);
      }
      if (body.domain !== undefined) {
        updates.push(`"domain" = $${idx++}`);
        values.push(body.domain);
      }

      if (body.oidcConfig) {
        const mergedOidc = { ...currentOidc, ...body.oidcConfig };
        updates.push(`"oidcConfig" = $${idx++}`);
        values.push(JSON.stringify(mergedOidc));
      }

      if (body.samlConfig) {
        const mergedSaml = { ...currentSaml, ...body.samlConfig };
        updates.push(`"samlConfig" = $${idx++}`);
        values.push(JSON.stringify(mergedSaml));
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        );
      }

      values.push(providerId);
      await client.query(
        `UPDATE "ssoProvider" SET ${updates.join(", ")} WHERE "providerId" = $${idx}`,
        values
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating SSO provider:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update provider" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sso/providers/[providerId]
 *
 * Delete an SSO provider.
 * Bypasses the built-in userId ownership check so any admin can
 * delete providers registered by other admins.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const perm = await requirePermission({ sso: ["update"] }, await headers());
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const { providerId } = await params;
    const client = await pgPool.connect();
    try {
      const { rowCount } = await client.query(
        `DELETE FROM "ssoProvider" WHERE "providerId" = $1`,
        [providerId]
      );

      if (rowCount === 0) {
        return NextResponse.json(
          { error: "Provider not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting SSO provider:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete provider" },
      { status: 500 }
    );
  }
}
