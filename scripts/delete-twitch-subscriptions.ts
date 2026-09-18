import "dotenv/config";

// Cleanup helper for scripts/register-twitch-webhook.ts -- deletes EventSub
// subscriptions so a fresh registration doesn't collide with stale
// pending/failed ones left over from an earlier attempt (e.g. after fixing
// a webhook-secret mismatch, the old subscriptions registered with the
// wrong secret are permanently "webhook_callback_verification_failed" and
// need to be removed before re-registering).
//
// Usage:
//   pnpm exec tsx scripts/delete-twitch-subscriptions.ts          # deletes ALL subscriptions
//   pnpm exec tsx scripts/delete-twitch-subscriptions.ts <id...>  # deletes only the given id(s)

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
  process.exit(1);
}

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
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

async function main() {
  const token = await getAppAccessToken();
  const headers = { "Client-Id": CLIENT_ID!, Authorization: `Bearer ${token}` };

  const explicitIds = process.argv.slice(2);
  let ids = explicitIds;

  if (ids.length === 0) {
    const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", { headers });
    const data = (await res.json()) as { data: Array<{ id: string; type: string; status: string }> };
    ids = data.data.map((s) => s.id);
    console.log(`Found ${ids.length} subscription(s) to delete:`);
    for (const s of data.data) {
      console.log(`  ${s.type} (${s.status}) -- ${s.id}`);
    }
  }

  for (const id of ids) {
    const res = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, {
      method: "DELETE",
      headers,
    });
    console.log(res.status === 204 ? `Deleted ${id}` : `Failed to delete ${id}: ${res.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
