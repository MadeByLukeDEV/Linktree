import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { Pool } from "pg";
import type { StaffRole } from "@/modules/auth/roles";

// Sessions are issued by the central auth service (auth.aboutselphy.com --
// Discord login gated by Discord server roles) and validated here by reading
// its tables straight from the shared Postgres instance. Adapted from that
// repo's consumer/validate-session.ts -- keep the two in sync.
//
// Env (same values as the auth service): AUTH_DATABASE_URL,
// AUTH_DATABASE_SCHEMA (default "auth"), BETTER_AUTH_SECRET (verifies the
// cookie signature), AUTH_COOKIE_PREFIX (default "better-auth").

export type StaffSession = {
  sessionId: string;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: StaffRole;
  };
};

declare global {
  var _authSessionPool: Pool | undefined;
}

// Constructed lazily, on first real use -- same reason as src/lib/prisma.ts
// (no env available during `next build`).
function pool() {
  const schema = process.env.AUTH_DATABASE_SCHEMA || "auth";
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("Invalid AUTH_DATABASE_SCHEMA");
  globalThis._authSessionPool ??= new Pool({
    connectionString: process.env.AUTH_DATABASE_URL,
    max: 3,
    options: `-c search_path=${schema}`,
  });
  return globalThis._authSessionPool;
}

function sessionCookieNames() {
  const prefix = process.env.AUTH_COOKIE_PREFIX || "better-auth";
  return [`__Secure-${prefix}.session_token`, `${prefix}.session_token`];
}

/** Extracts the raw session token from BetterAuth's signed cookie ("<token>.<base64 HMAC-SHA256>"). */
function verifySignedToken(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = decodeURIComponent(raw);
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const token = value.slice(0, dot);
  const signature = Buffer.from(value.slice(dot + 1), "base64");
  const expected = createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "").update(token).digest();
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  return token;
}

async function lookupSession(token: string): Promise<StaffSession | null> {
  const { rows } = await pool().query(
    `select s.id as "sessionId", s."expiresAt", u.id, u.name, u.email, u.image, u.role
       from "session" s
       join "user" u on u.id = s."userId"
      where s.token = $1
        and s."expiresAt" > now()
        and not (coalesce(u.banned, false) and (u."banExpires" is null or u."banExpires" > now()))`,
    [token],
  );
  const row = rows[0];
  if (!row || (row.role !== "admin" && row.role !== "moderator")) return null;

  return {
    sessionId: row.sessionId,
    expiresAt: row.expiresAt,
    user: { id: row.id, name: row.name, email: row.email, image: row.image, role: row.role },
  };
}

/**
 * The staff session for a cookie jar (a request's cookies, or next/headers'
 * cookies()), or null if signed out / expired / banned / not staff. Fails
 * closed: an unreachable auth DB is logged and treated as signed out.
 */
export async function getStaffSession(
  jar?: { get(name: string): { value: string } | undefined },
): Promise<StaffSession | null> {
  const store = jar ?? (await cookies());
  const raw = sessionCookieNames()
    .map((name) => store.get(name)?.value)
    .find(Boolean);
  const token = verifySignedToken(raw);
  if (!token) return null;

  try {
    return await lookupSession(token);
  } catch (error) {
    console.error("Session lookup against the auth database failed", error);
    return null;
  }
}

function authUrl(path: string, returnTo?: string) {
  const url = new URL(path, process.env.AUTH_URL || "https://auth.aboutselphy.com");
  if (returnTo) url.searchParams.set("redirect", returnTo);
  return url.toString();
}

/** Central login page; sends the user back to `returnTo` afterwards. */
export function loginUrl(returnTo?: string) {
  return authUrl("/login", returnTo);
}

/** Central sign-out page (signs out of every aboutselphy admin surface). */
export function logoutUrl(returnTo?: string) {
  return authUrl("/logout", returnTo);
}
