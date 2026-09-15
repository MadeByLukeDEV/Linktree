# redirects

Resolves a subdomain (e.g. `youtube` from `youtube.aboutselphy.com`) to a
target URL. Checks Redis first (`redirect:<subdomain>`, short TTL), falls
back to `social-links`' public service on a miss, then repopulates the
cache. Read-only cross-module call — never touches `social-links`'
`repository.ts` directly.

Consumed directly by `src/proxy.ts` (Next.js 16's `proxy` runs in the
Node.js runtime by default, so calling this service — Redis + Prisma — from
the proxy is safe). See [../README.md](../README.md) for cross-module
import rules.
