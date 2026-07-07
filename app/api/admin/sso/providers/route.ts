import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pgPool } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/**
 * Transform a raw ssoProvider DB row into the expected client-side shape.
 * This mirrors what better-auth's internal sanitizeProvider() does.
 */
function sanitizeProvider(row: any, baseUrl: string) {
  const oidcConfig = row.oidcConfig ? JSON.parse(row.oidcConfig) : null;
  const samlConfig = row.samlConfig ? JSON.parse(row.samlConfig) : null;

  const provider: Record<string, any> = {
    providerId: row.providerId,
    issuer: row.issuer,
    domain: row.domain,
    organizationId: row.organizationId ?? null,
    type: oidcConfig ? "oidc" : "saml",
    spMetadataUrl: `${baseUrl}/api/auth/sso/saml2/sp/metadata?providerId=${encodeURIComponent(row.providerId)}`,
  };

  if (oidcConfig) {
    provider.oidcConfig = {
      discoveryEndpoint: oidcConfig.discoveryEndpoint,
      clientIdLastFour: oidcConfig.clientId
        ? oidcConfig.clientId.slice(-4)
        : "",
      pkce: oidcConfig.pkce ?? true,
      authorizationEndpoint: oidcConfig.authorizationEndpoint,
      tokenEndpoint: oidcConfig.tokenEndpoint,
      userInfoEndpoint: oidcConfig.userInfoEndpoint,
      jwksEndpoint: oidcConfig.jwksEndpoint,
      scopes: oidcConfig.scopes,
      tokenEndpointAuthentication: oidcConfig.tokenEndpointAuthentication,
    };
  }

  if (samlConfig) {
    provider.samlConfig = {
      entryPoint: samlConfig.entryPoint,
      callbackUrl: samlConfig.callbackUrl,
      audience: samlConfig.audience,
      wantAssertionsSigned: samlConfig.wantAssertionsSigned,
      authnRequestsSigned: samlConfig.authnRequestsSigned,
      identifierFormat: samlConfig.identifierFormat,
      signatureAlgorithm: samlConfig.signatureAlgorithm,
      digestAlgorithm: samlConfig.digestAlgorithm,
    };
  }

  return provider;
}

/**
 * GET /api/admin/sso/providers
 *
 * Returns ALL SSO providers in the database.
 * Protected by the same RBAC used in the admin layout.
 * This bypasses the built-in sso.providers() filter that scopes
 * results to the current user's own providers.
 */
export async function GET() {
  try {
    const perm = await requirePermission({ sso: ["read"] }, await headers());
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

    const client = await pgPool.connect();
    try {
      const { rows: providers } = await client.query(
        `SELECT * FROM "ssoProvider" ORDER BY id DESC`
      );
      return NextResponse.json({
        providers: providers.map((row) => sanitizeProvider(row, baseUrl)),
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error listing SSO providers:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list SSO providers" },
      { status: 500 }
    );
  }
}
