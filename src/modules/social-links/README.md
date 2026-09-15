# social-links

Core module. Owns the `SocialLink` table: platform, label, url, icon, order,
`showOnProfile`, `subdomain`. A single entry can be shown on the public
profile, exposed as a subdomain forward, or both.

Files: `repository.ts` (internal), `service.ts` (internal), `actions.ts`
(public — server actions), `schema.ts` (zod). Dashboard CRUD UI lives in
`components/`. See [../README.md](../README.md) for cross-module import rules.

Writes that change `subdomain` must invalidate that subdomain's Redis cache
key so the `redirects` module never serves a stale target.
