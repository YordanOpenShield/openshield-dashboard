import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { pgPool } from "./db";
import { ac, loadRolesFromDb } from "./permissions";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./email";

// Suppress benign SAML library warning about missing SingleLogoutService.
// Keycloak's metadata doesn't advertise SLO endpoints; the login flow works fine.
const _origWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === "string" && args[0].includes("SingleLogoutService")) return;
  _origWarn.apply(console, args);
};

/**
 * Parse the SSO_ROLE_MAP env var into a mapping of IdP role → app role.
 * Format: comma-separated idp_role=app_role pairs.
 * Example: "admin=admin,openshield-admin=admin,viewer=viewer"
 *
 * IdP roles not in the map are ignored. App roles that don't have
 * a corresponding custom role in the DB are also ignored by the RBAC.
 */
function getRoleMap(): Map<string, string> {
  const raw = process.env.SSO_ROLE_MAP ?? "admin=admin";
  const map = new Map<string, string>();
  for (const entry of raw.split(",")) {
    const [idpRole, appRole] = entry.split("=").map((s) => s.trim());
    if (idpRole && appRole) {
      map.set(idpRole.toLowerCase(), appRole);
    }
  }
  return map;
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

/**
 * Load all role definitions from the custom_roles table in the database.
 * Roles are purely permission wrappers — there are no built-in roles.
 * Every role is created, edited, and deleted through the admin UI.
 *
 * At build time the DB won't be available, so we default to an empty set.
 * Changes to role definitions (permissions) take effect on server restart.
 */
const _roles = await loadRolesFromDb().catch(() => null) ?? {};

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

  // ── Account Linking ──────────────────────────────────────────────────────
  // Allow SSO users with the same email as an existing local account
  // to be linked automatically. This prevents "account_not_linked" errors.
  account: {
    accountLinking: {
      enabled: true,
      disableImplicitLinking: false,
      trustedProviders: ["openshield-saml"],
    },
  },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Only allow password reset for email/password (credential) users.
      // SSO-only users don't have a local password to reset.
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          `SELECT 1 FROM account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
          [user.id]
        );
        if (result.rowCount === 0) {
          console.info(
            `[auth] Password reset blocked for ${user.email}: no credential account found (SSO-only user)`
          );
          return;
        }
      } finally {
        client.release();
      }
      await sendPasswordResetEmail(user.email, url);
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => {
      console.info(`[auth] Password reset for user ${user.id}`);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  socialProviders: {
    // Add social providers here if needed
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
  },

  plugins: [
    // RBAC — all roles are custom permission wrappers stored in the DB.
    // There are no built-in roles. Every user's permissions are determined
    // by the custom roles assigned to them (comma-separated in user.role).
    // Admins create/edit/delete roles and their permissions via the UI.
    adminPlugin({
      ac,
      roles: _roles,
      adminRoles: [],
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
        // via extraFields mapping (e.g., extraFields: { roles: "Role" })
        if (provider.samlConfig && userInfo?.roles) {
          idpRoles = Array.isArray(userInfo.roles)
            ? userInfo.roles
            : String(userInfo.roles).split(",").map((r) => r.trim());
        }

        // No roles found — user stays with whatever role they have (defaults to 'user')

        // Map IdP roles to app roles using SSO_ROLE_MAP, then fully replace.
        // The IdP is the source of truth — any roles not in the map are dropped.
        const roleMap = getRoleMap();
        const appRoles = [...new Set(
          idpRoles
            .map((r) => roleMap.get(r.toLowerCase()))
            .filter((r): r is string => r !== undefined)
        )];

        const client = await pgPool.connect();
        try {
          await client.query(
            `UPDATE "user" SET role = $1 WHERE id = $2`,
            [appRoles.join(",") || null, user.id]
          );
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
