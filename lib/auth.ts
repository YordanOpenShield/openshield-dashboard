import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { pgPool } from "./db";
import { ac, admin as adminRole, user as userRole } from "./permissions";

/**
 * Parse the SSO_ADMIN_ROLES env var into a set of lowercase role names.
 */
function getAdminRoleSet(): Set<string> {
  const raw = process.env.SSO_ADMIN_ROLES ?? "admin,openshield-admin";
  return new Set(raw.split(",").map((r) => r.trim().toLowerCase()));
}

/**
 * Determine whether any of the IdP roles qualifies for app-level admin.
 */
function isIdpAdmin(idpRoles: string[]): boolean {
  const adminRoles = getAdminRoleSet();
  return idpRoles.some((role) => adminRoles.has(role.toLowerCase()));
}

/**
 * Decode a JWT payload without adding a dependency.
 * JWT payload is base64url-encoded JSON.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) return {};
  try {
    // Base64url → base64 → string → JSON
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * Extract role names from a Keycloak access token.
 * Checks both realm roles and client-level roles.
 */
function extractKeycloakRoles(payload: Record<string, unknown>): string[] {
  const roles: string[] = [];

  // Realm-level roles (realm_access.roles)
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  if (realmAccess?.roles) {
    roles.push(...realmAccess.roles);
  }

  // Client-level roles (resource_access.{client-id}.roles)
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  if (resourceAccess) {
    for (const client of Object.values(resourceAccess)) {
      if (client?.roles) {
        roles.push(...client.roles);
      }
    }
  }

  return roles;
}

export const auth = betterAuth({
  database: pgPool,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    // Development — allow Keycloak on localhost
    "http://localhost:8080",
    // Production — add your Keycloak/IdP URLs here
    "https://auth.cyberdef.cc",
  ],

  // ── Session ──────────────────────────────────────────────────────────────
  // Uses better-auth defaults: expiresIn=7d, updateAge=1d
  // Role syncing happens at login time via provisionUser below.

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // Add social providers here if needed
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
  },

  plugins: [
    // RBAC — defines user (read-only) and admin (full access) roles
    adminPlugin({
      ac,
      roles: {
        user: userRole,
        admin: adminRole,
      },
      adminRoles: ["admin"],
      defaultRole: "user",
    }),

    // SSO — OIDC and SAML provider support
    sso({
      // Allow up to 10 SSO providers
      providersLimit: 10,

      // Refresh user role on every SSO login, not just the first registration
      provisionUserOnEveryLogin: true,

      // Map roles from the IdP (Keycloak, Okta, etc.) to app roles
      provisionUser: async ({ user, userInfo, token, provider }) => {
        let idpRoles: string[] = [];

        // OIDC — decode the access token to get realm/client roles
        if (provider.oidcConfig && token?.accessToken) {
          const payload = decodeJwtPayload(token.accessToken);
          idpRoles = extractKeycloakRoles(payload);
        }

        // SAML — roles may come as an attribute in the SAML assertion
        if (provider.samlConfig && userInfo?.roles) {
          idpRoles = Array.isArray(userInfo.roles)
            ? userInfo.roles
            : String(userInfo.roles).split(",").map((r) => r.trim());
        }

        const client = await pgPool.connect();
        try {
          if (isIdpAdmin(idpRoles)) {
            await client.query(`UPDATE "user" SET role = 'admin' WHERE id = $1`, [user.id]);
          } else {
            // Ensure the user is not an admin if they lack the IdP role
            // Only downgrades users who were provisioned via SSO
            await client.query(
              `UPDATE "user" SET role = 'user' WHERE id = $1 AND role = 'admin'`,
              [user.id]
            );
          }
        } finally {
          client.release();
        }
      },

      // SAML security settings
      saml: {
        // 5 minute clock skew tolerance
        clockSkew: 5 * 60 * 1000,
        // Allow IdP-initiated SSO
        allowIdpInitiated: true,
        // Warn on deprecated algorithms (SHA-1, etc.)
        algorithms: {
          onDeprecated: "warn",
        },
      },
    }),
  ],
});
