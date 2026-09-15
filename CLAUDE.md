@AGENTS.md

# Social Media Link Tree

A Linktree-style app. `social.aboutselphy.com` is the public link tree. The
owner can also define an arbitrary number of **subdomain forwards** in the
dashboard (e.g. `youtube.aboutselphy.com`, `instagram.aboutselphy.com`,
`tiktok.aboutselphy.com`) that redirect visitors straight to the matching
real profile URL — this is data-driven, not hardcoded to any one platform.

## Tech stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- shadcn/ui (`base-nova` style, Base UI primitives, not Radix) + Framer Motion
- Prisma ORM on **MariaDB** (via Prisma's `mysql` provider — Prisma has no
  dedicated `mariadb` provider; connection strings use the `mysql://` scheme,
  not `mariadb://`, even though the DB itself is MariaDB)
- Redis (`ioredis`) — shared cache for subdomain-redirect lookups and YouTube
  API responses (works correctly across multiple Dokploy container instances)
- BetterAuth with the admin plugin (single owner account, no public signup)
- next-intl (German/English, device-default locale)
- next-themes (dark/light, device-default via `prefers-color-scheme`)
- Package manager: **pnpm**
- Deployment: **Dokploy** (self-hosted, Docker) — `output: 'standalone'`

## Next.js 16 — do not use stale Next 14/15 knowledge

This version has real breaking changes. Before writing framework code, check
`node_modules/next/dist/docs/01-app/` if unsure. Confirmed differences that
matter here:

- **`middleware.ts` is deprecated → `src/proxy.ts`**, exported function is
  `proxy` (not `middleware`). `proxy` always runs in the **Node.js runtime**
  (Edge is no longer an option for it) — this is why the subdomain-redirect
  logic can call Redis/Prisma directly from `proxy.ts` instead of needing an
  edge-safe rewrite-to-internal-route workaround.
- Route Handler `params` is `Promise<{...}>` — always `await` it.
  `cookies()`/`headers()`/`draftMode()` must always be awaited too (sync
  access is fully removed, not just deprecated).
- Node.js 20.9+ required. `next lint` is removed — `pnpm lint` calls ESLint
  directly (already wired up in `package.json`).
- `images.domains` is deprecated → use `images.remotePatterns` (relevant for
  avatar uploads and YouTube thumbnails).
- `output: 'standalone'` is unchanged — still correct for the Dokploy Docker
  build.

## Prisma 7 — also do not use stale knowledge

npm's `latest` dist-tag for the `prisma` CLI package currently points at a
**8.0.0-rc.15 prerelease** (while `@prisma/client`'s `latest` tag is still
7.10.0 stable) — `pnpm add prisma` / `pnpm dlx prisma ...` will silently pull
the RC and its large unrelated dependency tree (Cloudflare `workerd`,
`alchemy`, `effect`, `pglite`). This project pins both packages to the exact
stable `7.10.0` — always use `pnpm exec prisma ...` (uses the pinned local
version), never `pnpm dlx prisma ...` (re-resolves to whatever `latest`
currently means). Re-check `npm view prisma dist-tags` before ever bumping
this dependency.

Other Prisma 7 changes vs. older knowledge:

- Config lives in **`prisma7.config.ts`** (not `schema.prisma`'s old
  `env()` datasource URL, and not a `prisma.config.ts` — this exact
  filename is what this installed version resolves; `prisma validate`
  confirms it loaded correctly). It reads `DATABASE_URL` via `dotenv/config`.
- The client generator (`provider = "prisma-client"`) outputs to
  `src/generated/prisma` (gitignored, regenerate with `pnpm exec prisma
  generate`) instead of `node_modules/@prisma/client`.
- Client construction uses a **driver adapter**, not an implicit
  `datasourceUrl`: see `src/lib/prisma.ts` (`@prisma/adapter-mariadb` +
  `PrismaMariaDb`, constructed directly from the `DATABASE_URL` string).
- `prisma migrate diff --to-schema-datamodel` was renamed to
  `--to-schema`.
- The DB is MariaDB, but `datasource db { provider = "mysql" }` in
  `schema.prisma` is correct — Prisma has no separate `mariadb` provider.
  `DATABASE_URL` must use the `mysql://` scheme (not `mariadb://`, which
  Prisma's own URL parser rejects with P1013 even though the driver adapter
  itself accepts either). URL-encode special characters in the password
  (e.g. `+` → `%2B`, `=` → `%3D`) or Prisma misparses the connection string.
- MySQL/MariaDB's default `String` maps to `VARCHAR(191)`; fields that need
  more room (`Profile.bio`, `SocialLink.url`/`icon`) have explicit
  `@db.Text`/`@db.VarChar(2048)` annotations — add these deliberately on any
  new long-text field instead of leaving the 191-char default.
- **Migrations on this DB**: the provided MariaDB user has no `CREATEDB`
  grant, so `prisma migrate dev` fails with `P3014` (can't create the shadow
  database), and `prisma migrate diff --from-migrations` also fails (it
  needs a `shadowDatabaseUrl` to replay migration history). Workflow used
  instead for every schema change:
  1. Get the *previous* committed `schema.prisma` into a temp file, e.g.
     `git show main:prisma/schema.prisma > /tmp/schema_prev.prisma` (use
     `--from-empty` instead of step 2's `--from-schema` for the very first
     migration, when there is no previous state).
  2. `pnpm exec prisma migrate diff --from-schema /tmp/schema_prev.prisma
     --to-schema prisma/schema.prisma --script` — purely file-based, no DB
     access needed — redirect the output into a new
     `prisma/migrations/<timestamp>_<name>/migration.sql`.
  3. `pnpm exec prisma migrate deploy` (applies pending migration files;
     unlike `migrate dev` this needs no shadow-DB permissions).
  4. `pnpm exec prisma generate` to refresh the client.
  A `prisma/migrations/migration_lock.toml` (`provider = "mysql"`) must
  exist for `migrate diff`/`deploy` to work — it's normally created
  automatically by `migrate dev`, which this workflow never runs, so it was
  created by hand once and is now committed.
- BetterAuth's schema-generator CLI is the **`auth`** npm package (e.g.
  `pnpm dlx auth@1.7.5 generate --config src/modules/auth/server.ts -y`), not
  the deprecated `@better-auth/cli`. Regenerate the four auth tables this way
  after changing `src/modules/auth/server.ts`, then reapply the diff workflow
  above for the resulting schema change.

## Modular monolith architecture

One deployable app, internally split into self-contained modules under
`src/modules/*` with enforced boundaries. Full rules and the module map are
in [src/modules/README.md](src/modules/README.md) — read it before adding or
touching a module. Short version:

- Only a module's `actions.ts`/`service.ts` (or `index.ts` barrel) is
  imported from outside that module. `repository.ts` (Prisma queries) and
  internal components never get imported cross-module.
- `src/app/**` routes stay thin: call a module's action/service, render its
  components. No business logic or Prisma calls directly in `app/`.

```
src/
  proxy.ts                # replaces middleware.ts; Node runtime; handles subdomain redirects
  app/                     # routes only
    (public)/              # public profile page (social.aboutselphy.com)
    (dashboard)/dashboard/  # protected owner dashboard
    api/auth/[...all]/      # BetterAuth route handler
  modules/                 # see src/modules/README.md
    auth/  social-links/  profile/  redirects/  youtube/  i18n/  theme/
  components/ui/           # shadcn primitives — shared, not a "module"
  lib/                     # cross-cutting: prisma client, redis client, generic utils
prisma/
  schema.prisma            # single physical schema, organized into commented sections per module
```

## Frontend conventions

- **Units: always `rem`, never `px`.** This includes the min/max bounds of
  any `clamp()` — e.g. `clamp(1rem, 2vw, 1.75rem)`, not
  `clamp(16px, 2vw, 28px)`.
- **Fluid responsive sizing via `clamp()`** instead of stacking many Tailwind
  breakpoint variants. Prefer a small reusable fluid type/spacing scale
  (Tailwind theme `extend` entries) over one-off `clamp()` calls per
  component.
- **Skeleton loading** for anything async: shadcn `Skeleton` matching the
  real content's dimensions, driven by `loading.tsx` / `<Suspense>` per route
  segment. Applies to the dashboard social-links list, the public profile
  page, and the YouTube video/short card.
- shadcn here uses the `base-nova` style on **Base UI**, not Radix — and the
  old react-hook-form `Form` component doesn't exist in this style. Use the
  `Field`/`FieldGroup`/`FieldLabel`/`FieldError` primitives
  (`src/components/ui/field.tsx`) together with `react-hook-form` +
  `@hookform/resolvers/zod` directly. Composing a custom trigger element
  (e.g. wrapping `Dialog`/`DropdownMenu` around your own button) uses Base
  UI's `render` prop — `<DialogTrigger render={<Button>...</Button>} />` —
  not Radix's `asChild`.
- **Client components seeded from server props don't self-update on
  `revalidatePath`.** `useState(initialLinks)` only reads its argument on
  first mount — a parent Server Component re-rendering with fresh data after
  a mutation does *not* reset that state. Hit this in `LinkList`
  (`src/modules/social-links/components/link-list.tsx`): after
  `createSocialLinkAction`/`updateSocialLinkAction`, the list stayed stale
  until reload. Fixed by having those actions return the created/updated
  record and having the dialog call an `onSuccess(record)` callback that
  updates the client list's local state directly, instead of relying on
  `revalidatePath` to flow new props down through an already-mounted client
  boundary. Apply the same pattern to any other server-seeded, client-owned
  list/collection.

## Branching & commits

- Every feature/fix gets its own branch: `feature_x`, `fix_x`. Work that
  belongs to the same module/component stays on one branch; a different
  module/component gets a new branch.
- Commits are detailed and scoped to one logical change — not one giant
  commit per branch.
- No remote is configured yet — do not add one or push without asking first.

## Commands

```
pnpm dev            # start dev server (Turbopack)
pnpm build          # production build
pnpm start          # run the standalone production build
pnpm lint           # ESLint (next lint no longer exists in Next 16)
pnpm exec prisma migrate deploy   # apply migrations (see the shadow-DB note above re: migrate dev)
pnpm exec prisma generate         # regenerate the client after a schema change
pnpm exec prisma studio           # inspect the DB
```

## Environment variables

See [.env.example](.env.example): `DATABASE_URL`, `REDIS_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PASSKEY_RP_ID` (leave unset in dev
— defaults to `localhost`; set to the production domain, e.g.
`aboutselphy.com`, once deployed), `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`. The user provides
`DATABASE_URL` and `REDIS_URL` directly — no local Docker MariaDB/Redis
containers for dev.

**Redis reachability history** — the original `REDIS_URL` host (a public IP)
was unreachable from this dev sandbox (`connect ETIMEDOUT`) even though the
same sandbox reached `DATABASE_URL` (MariaDB) on the same box fine. Switching
`DATABASE_URL`/`REDIS_URL` to the box's Tailscale IP fixed MariaDB
immediately and fixed Redis after some server-side firewall/config work —
confirmed working end-to-end (`PING` → `PONG`, and real subdomain-redirect
cache hits/invalidation verified live). The app's Redis ACL user also lacks
`INFO` permission (breaks ioredis's default ready check — disabled via
`enableReadyCheck: false` in `src/lib/redis.ts`) and, in some ad-hoc
one-off scripts outside the app's normal request path, `GET`/`DEL` on
`redirect:*` keys threw `NOPERM` even though the exact same keys were
readable/writable through the app's own long-lived connection — never
root-caused (possibly an ACL being tuned live on the server side), but
harmless in practice because every Redis call in the app is written to fail
soft regardless. Because of that history, every Redis call in the app
(`src/lib/redirect-cache.ts`, `src/modules/redirects/service.ts`) is
written to fail soft: a failed cache read/write is logged and swallowed,
falling back to the database, never allowed to fail the write/redirect that
triggered it. `src/lib/redis.ts` also caps `maxRetriesPerRequest`/backoff so
a dead Redis degrades gracefully instead of hanging. If Redis-dependent
features seem to silently not cache anything, check reachability from
wherever the app is actually running (and the ACL's permissions) before
assuming a code bug.

## Auth

Single owner account, no public sign-up route. `src/modules/auth/server.ts`
wires up BetterAuth with the Prisma adapter, the **admin** plugin
(`role: "admin"` is set by hand on the owner row — `defaultRole` is
`"user"`), and the **`@better-auth/passkey`** plugin so the owner can sign in
with a hardware security key or a passkey manager like Bitwarden instead of
a password (WebAuthn is authenticator-agnostic — both work the same way from
the app's side). `nextCookies()` must stay last in the `plugins` array.

- Create/update the owner account: `pnpm create-owner <email> <password>
  [name]` (or `OWNER_EMAIL`/`OWNER_PASSWORD`/`OWNER_NAME` env vars) —
  `scripts/create-owner.ts`, calls `auth.api.signUpEmail` then promotes the
  user to `role: "admin"` via Prisma directly.
- `src/proxy.ts` protects `/dashboard/**` by calling
  `auth.api.getSession({ headers })` directly (safe because Next 16's
  `proxy` always runs in the Node.js runtime) and redirecting to `/sign-in`
  when there's no session.
- Passkey registration/authentication is a real WebAuthn ceremony and can't
  be driven headlessly — verified everything else (redirect-when-signed-out,
  email/password sign-in, dashboard render, sign-out) with a Playwright
  script against the dev server; the "Add a passkey" / "Sign in with a
  passkey" buttons need a manual check in an actual browser with a key or
  Bitwarden set up.

## Subdomain forwards

`src/proxy.ts` runs on every path except static assets (`matcher:
["/((?!_next/static|_next/image|favicon.ico).*)"]`). It reads the `Host`
header (stripped of port) and extracts a candidate subdomain label: hosts
that are `localhost`/`127.0.0.1`, exactly `NEXT_PUBLIC_ROOT_DOMAIN`,
`www.<root>`, or `social.<root>`, or whose first label is in
`RESERVED_SUBDOMAINS` (`src/lib/reserved-subdomains.ts` — shared with the
create/edit form's slug validation in `social-links/schema.ts` so the two
lists can't drift apart) are treated as the main app, not a forward.
Anything else calls `modules/redirects`' `resolveSubdomain`, which checks
Redis (`redirect:<subdomain>`, 5 min TTL) then falls back to
`social-links`' public `getBySubdomain` service function on a miss
(read-only cross-module call — never touches `social-links`'
`repository.ts`), and redirects (307) to the resolved URL, or back to
`NEXT_PUBLIC_SITE_URL` if the subdomain isn't configured. `social-links`'
`updateLink`/`deleteLink` invalidate the old subdomain's cache key on
*any* update to a link that had one (not just when the subdomain value
itself changes) — a bug caught during testing: changing a link's
destination URL while keeping the same subdomain left the cache serving
the stale target until the TTL expired.

Verified locally with `curl -H "Host: <label>.aboutselphy.com"
http://localhost:3000/` (spoofing the Host header directly, since there's
no real subdomain DNS in dev) — confirmed configured subdomains redirect,
unconfigured ones fall back, reserved/main hosts route normally, and cache
invalidation on edit/delete is immediate.

Requires wildcard DNS (`*.aboutselphy.com`) and matching Dokploy domain
config in production — document the exact steps here once Dokploy is set
up (Phase 9).

## Feature status

- [x] Phase 0 — repo, Next.js scaffold, shadcn/ui, Framer Motion, module
      skeleton, Redis client, CLAUDE.md
- [x] Phase 1 — Prisma schema (auth tables, `Profile`, `SocialLink`),
      migrated against the real DB
- [x] Phase 2 — BetterAuth (admin + passkey plugins), sign-in page (password
      and passkey), `/dashboard` route protection via `proxy.ts`,
      `pnpm create-owner` bootstrap script
- [x] Phase 3 — `social-links` + `profile` modules, dashboard CRUD: tabbed
      dashboard (Links/Profile/Security), drag-to-reorder link list
      (`@dnd-kit`), create/edit dialog with subdomain-slug validation and a
      friendly "subdomain already in use" error, profile form, `sonner`
      toasts (added the missing `<Toaster />` to the root layout)
- [x] Phase 4 — public profile page (`src/app/page.tsx`): avatar/name/bio +
      visible links with staggered Framer Motion entrance, empty state,
      `loading.tsx` skeleton. Verified `revalidatePath("/")` actually keeps
      it in sync with dashboard edits (no rebuild needed) via a live
      browser test
- [x] Phase 5 — data-driven subdomain redirects (`proxy.ts` + `redirects`
      module), verified live against multiple subdomains with cache
      invalidation on edit/delete
- [ ] Phase 6 — YouTube latest video/short integration
- [ ] Phase 7 — i18n (German/English, device default)
- [ ] Phase 8 — dark/light theme (device default)
- [ ] Phase 9 — Dockerize for Dokploy
