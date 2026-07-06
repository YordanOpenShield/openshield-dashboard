import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { ssoClient } from "@better-auth/sso/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    adminClient(),
    ssoClient(),
  ],
});
