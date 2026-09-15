import "dotenv/config";

// One-off setup script, not something the running app ever calls itself.
// Registers this app's /api/twitch/eventsub route as the webhook target for
// Twitch's stream.online/stream.offline EventSub events, so the public
// page's live badge (src/modules/twitch/components/twitch-live-badge.tsx)
// gets pushed updates in near-real-time instead of polling Twitch's API.
//
// Twitch calls the callback URL synchronously during this registration to
// prove it's reachable (the webhook_callback_verification handshake) -- so
// NEXT_PUBLIC_SITE_URL must already point at a deployed, publicly
// reachable instance of this app before running this script. Running it
// against localhost will fail.
//
// Usage: pnpm register-twitch-webhook
// Requires TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN,
// TWITCH_WEBHOOK_SECRET, and NEXT_PUBLIC_SITE_URL in the environment.

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const BROADCASTER_LOGIN = process.env.TWITCH_BROADCASTER_LOGIN;
const WEBHOOK_SECRET = process.env.TWITCH_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

if (!CLIENT_ID || !CLIENT_SECRET || !BROADCASTER_LOGIN || !WEBHOOK_SECRET || !SITE_URL) {
  console.error(
    "Missing one of: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, " +
      "TWITCH_BROADCASTER_LOGIN, TWITCH_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL"
  );
  process.exit(1);
}

const CALLBACK_URL = `${SITE_URL}/api/twitch/eventsub`;

async function getAppAccessToken(): Promise<string> {
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to get app access token: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function getBroadcasterId(token: string): Promise<string> {
  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(BROADCASTER_LOGIN!)}`,
    { headers: { "Client-Id": CLIENT_ID!, Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Failed to look up broadcaster: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { data: Array<{ id: string }> };
  const id = data.data[0]?.id;
  if (!id) {
    throw new Error(`No Twitch user found for login "${BROADCASTER_LOGIN}"`);
  }
  return id;
}

async function createSubscription(
  token: string,
  type: "stream.online" | "stream.offline",
  broadcasterId: string
) {
  const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      "Client-Id": CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      version: "1",
      condition: { broadcaster_user_id: broadcasterId },
      transport: {
        method: "webhook",
        callback: CALLBACK_URL,
        secret: WEBHOOK_SECRET,
      },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create "${type}" subscription: ${res.status} ${JSON.stringify(body)}`);
  }
  console.log(`Created "${type}" subscription:`, body.data[0].id, `(status: ${body.data[0].status})`);
}

async function main() {
  const token = await getAppAccessToken();
  const broadcasterId = await getBroadcasterId(token);
  console.log(`Registering EventSub webhooks for broadcaster ${BROADCASTER_LOGIN} (${broadcasterId})`);
  console.log(`Callback URL: ${CALLBACK_URL}`);

  await createSubscription(token, "stream.online", broadcasterId);
  await createSubscription(token, "stream.offline", broadcasterId);

  console.log(
    "Done. Status should flip to \"enabled\" once Twitch's callback " +
      "verification against the URL above succeeds -- check with " +
      "`pnpm exec tsx scripts/list-twitch-subscriptions.ts` or the Twitch " +
      "CLI if a subscription stays \"webhook_callback_verification_pending\"."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
