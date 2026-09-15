import "dotenv/config";

// Debugging helper for scripts/register-twitch-webhook.ts -- lists current
// EventSub subscription status (e.g. "enabled" vs
// "webhook_callback_verification_pending" vs "webhook_callback_verification_failed")
// without creating anything new.
//
// Usage: pnpm exec tsx scripts/list-twitch-subscriptions.ts

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
  process.exit(1);
}

async function main() {
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });
  const { access_token: token } = (await tokenRes.json()) as { access_token: string };

  const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    headers: { "Client-Id": CLIENT_ID!, Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as {
    data: Array<{ id: string; type: string; status: string; condition: unknown }>;
  };

  for (const sub of data.data) {
    console.log(`${sub.type}: ${sub.status} (id: ${sub.id})`);
  }
  if (data.data.length === 0) {
    console.log("No subscriptions registered.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
