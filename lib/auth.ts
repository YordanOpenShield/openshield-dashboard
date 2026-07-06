import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { pgPool } from "./db";
import { ac, admin as adminRole, user as userRole } from "./permissions";

export const auth = betterAuth({
  database: pgPool,
  baseURL: process.env.BETTER_AUTH_URL,
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
