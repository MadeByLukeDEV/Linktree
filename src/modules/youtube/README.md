# youtube

Fetches the latest video + latest short via the YouTube Data API v3, cached
in Redis (e.g. 1h TTL) to avoid quota exhaustion and stay consistent across
Dokploy container instances. No DB dependency. Falls back gracefully (skip
rendering) when `YOUTUBE_API_KEY`/`YOUTUBE_CHANNEL_ID` are unset.
Card component in `components/`. See [../README.md](../README.md) for
cross-module import rules.
