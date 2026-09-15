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
