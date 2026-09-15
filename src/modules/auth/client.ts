import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [adminClient(), passkeyClient()],
});

export const { signIn, signOut, useSession } = authClient;
