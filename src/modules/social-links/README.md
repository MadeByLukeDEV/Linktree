# social-links

Core module. Owns the `SocialLink` table: platform, label, url, icon, order,
`showOnProfile`, `subdomain`. A single entry can be shown on the public
profile, exposed as a subdomain forward, or both.

Also owns `LinkGroup` — an optional named section (e.g. "Partners", "Merch")
a link can belong to (`SocialLink.groupId`, one group per link, nullable).
Links with no group render ungrouped, ahead of any named sections, on both
the dashboard and the public page. `order` is scoped per bucket (a link's
group, or the ungrouped bucket) rather than one global sequence across every
link — see the `nextOrder`/`reorder` comments in `repository.ts`. Deleting a
group does not delete its links; they fall back to the ungrouped bucket
(`onDelete: SetNull` in `schema.prisma`).

Files: `repository.ts` (internal), `service.ts` (internal), `actions.ts`
(public — server actions), `schema.ts` (zod). Dashboard CRUD UI lives in
`components/`. See [../README.md](../README.md) for cross-module import rules.

Writes that change `subdomain` must invalidate that subdomain's Redis cache
key so the `redirects` module never serves a stale target.
