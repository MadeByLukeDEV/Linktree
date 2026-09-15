# twitch

Tracks whether the broadcaster is currently live on Twitch, so the public
page can show a small pulsing badge on the Twitch link's icon when they are
(and nothing at all when they're not). Push-based via Twitch's EventSub
webhooks, not polling: `src/app/api/twitch/eventsub/route.ts` receives
`stream.online`/`stream.offline` notifications and writes a boolean into
Redis (`service.ts`'s `setLive`/`isLive`), which the public page reads on
every request. No DB dependency.

Falls back gracefully (badge never renders) when `TWITCH_BROADCASTER_LOGIN`/
`TWITCH_WEBHOOK_SECRET` are unset (`isTwitchConfigured()`).

One-time setup, not something the running app does itself:
`pnpm register-twitch-webhook` (`scripts/register-twitch-webhook.ts`)
registers the EventSub subscriptions against Twitch, pointing at this app's
webhook route. Twitch calls that route synchronously during registration to
verify it's reachable, so this only works once the app is deployed and
publicly reachable — it cannot be verified against localhost.
`scripts/list-twitch-subscriptions.ts` is a read-only helper for checking
subscription status if one gets stuck pending/failed.

Badge component in `components/`. See [../README.md](../README.md) for
cross-module import rules.
