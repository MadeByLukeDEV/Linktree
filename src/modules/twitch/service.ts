import { createHmac, timingSafeEqual } from "node:crypto";
import { redis } from "@/lib/redis";

const LIVE_CACHE_KEY = "twitch:live";
// Safety net, not a real TTL for "how long a stream can run": if a
// stream.offline notification is ever dropped (Twitch retries deliveries,
// but nothing is 100% guaranteed), this stops the badge from claiming
// "live" forever instead of just until the next real state change.
const LIVE_CACHE_TTL_SECONDS = 12 * 60 * 60;

export function isTwitchConfigured(): boolean {
  return Boolean(
    process.env.TWITCH_BROADCASTER_LOGIN && process.env.TWITCH_WEBHOOK_SECRET
  );
}

export async function isLive(): Promise<boolean> {
  if (!isTwitchConfigured()) {
    return false;
  }
  try {
    return Boolean(await redis.get(LIVE_CACHE_KEY));
  } catch (error) {
    console.error("Twitch live-status cache lookup failed:", error);
    return false;
  }
}

// -- Diagnostics, for the dashboard's admin-only Twitch status tab -------
//
// Distinct from isTwitchConfigured() (which only checks the two vars the
// *running app* needs at request time to verify/accept webhooks) --
// CLIENT_ID/CLIENT_SECRET are only ever needed for this diagnostics check
// and the one-off scripts/register-twitch-webhook.ts, never by the
// webhook route itself.
export type TwitchEnvStatus = {
  clientId: boolean;
  clientSecret: boolean;
  broadcasterLogin: boolean;
  webhookSecret: boolean;
};

export function getEnvStatus(): TwitchEnvStatus {
  return {
    clientId: Boolean(process.env.TWITCH_CLIENT_ID),
    clientSecret: Boolean(process.env.TWITCH_CLIENT_SECRET),
    broadcasterLogin: Boolean(process.env.TWITCH_BROADCASTER_LOGIN),
    webhookSecret: Boolean(process.env.TWITCH_WEBHOOK_SECRET),
  };
}

export type EventSubSubscription = {
  id: string;
  type: string;
  status: string;
  callback: string;
  createdAt: string;
};

export type EventSubDiagnostics =
  | { ok: true; subscriptions: EventSubSubscription[] }
  | { ok: false; error: string };

async function getAppAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!;
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to get app access token: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Queries Twitch directly for this app's actual EventSub subscriptions and
// their status (enabled / webhook_callback_verification_pending /
// webhook_callback_verification_failed / etc.) -- the definitive way to
// tell whether the webhook registered via `pnpm register-twitch-webhook`
// actually took, since the running app has no other record of it (no DB
// row, nothing logged locally at registration time).
export async function checkEventSubStatus(): Promise<EventSubDiagnostics> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error: "TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET are not set on this deployment.",
    };
  }

  try {
    const token = await getAppAccessToken();
    const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, error: `Twitch API request failed: ${res.status} ${await res.text()}` };
    }
    const data = (await res.json()) as {
      data: Array<{
        id: string;
        type: string;
        status: string;
        transport: { callback: string };
        created_at: string;
      }>;
    };
    return {
      ok: true,
      subscriptions: data.data.map((s) => ({
        id: s.id,
        type: s.type,
        status: s.status,
        callback: s.transport.callback,
        createdAt: s.created_at,
      })),
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function setLive(live: boolean): Promise<void> {
  try {
    if (live) {
      await redis.set(LIVE_CACHE_KEY, "1", "EX", LIVE_CACHE_TTL_SECONDS);
    } else {
      await redis.del(LIVE_CACHE_KEY);
    }
  } catch (error) {
    console.error("Failed to update Twitch live-status cache:", error);
  }
}

// Twitch EventSub signs each webhook delivery with an HMAC-SHA256 over
// `messageId + messageTimestamp + rawBody`, using the same secret this app
// registered the subscription with (TWITCH_WEBHOOK_SECRET). The raw,
// unparsed request body must be used -- re-serializing parsed JSON can
// produce different bytes (key order, whitespace) and break verification.
// https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#verifying-the-event-message
export function verifyEventSubSignature(
  rawBody: string,
  messageId: string | null,
  messageTimestamp: string | null,
  signature: string | null
): boolean {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;
  if (!secret || !messageId || !messageTimestamp || !signature) {
    return false;
  }

  const expected =
    "sha256=" +
    createHmac("sha256", secret)
      .update(messageId + messageTimestamp + rawBody)
      .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
