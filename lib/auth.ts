import { betterAuth } from "better-auth";
import { pgPool } from "./db";

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
});
