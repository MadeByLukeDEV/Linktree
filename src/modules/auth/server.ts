import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Single-owner app: no public sign-up route. Accounts are created with the
  // scripts/create-owner.ts bootstrap script instead.
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin(),
    // Hardware security keys and platform/software authenticators (e.g. a
    // Bitwarden-stored passkey) both work here — WebAuthn is authenticator
    // agnostic. rpID must match the page's actual domain, so leave it unset
    // in dev (defaults to "localhost") and set PASSKEY_RP_ID in production.
    passkey({
      rpID: process.env.PASSKEY_RP_ID,
      rpName: "aboutselphy",
    }),
    // Must be last so Set-Cookie headers from the plugins above are applied.
    nextCookies(),
  ],
});
