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
- `dotenv` and `tsx` are regular `dependencies`, not `devDependencies`, even
  though that looks wrong at a glance. `prisma7.config.ts` unconditionally
  `import`s `dotenv/config`, and that file is read by the `prisma` CLI on
  every invocation including `migrate deploy` in production — a
  production-only (`pnpm install --prod`) install would otherwise be
  missing `dotenv` and fail. `tsx` runs `scripts/create-owner.ts`, which is
  meant to be run against production too (see "Dokploy deployment" below).

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
    api/twitch/eventsub/    # Twitch EventSub webhook receiver
  modules/                 # see src/modules/README.md
    auth/  social-links/  profile/  redirects/  youtube/  twitch/  i18n/  theme/
  components/ui/           # shadcn primitives — shared, not a "module"
  lib/                     # cross-cutting: prisma client, redis client, generic utils
prisma/
  schema.prisma            # single physical schema, organized into commented sections per module
```

## Frontend conventions

- **Brand color**: `#00FFA8`, set directly as `--primary`/`--ring` in both
  `:root` and `.dark` in `globals.css` (kept as a plain hex rather than
  converted to match the rest of the oklch-based palette — mixing color
  formats across custom properties is valid CSS). `--primary-foreground`
  is a near-black in both themes for contrast against this bright color.
- **Global decorative layer**: `src/components/effects/` holds
  `AnimatedBackground` (a fixed, `pointer-events-none` grid + slowly
  drifting blurred brand-color orbs, `-z-10`) and `CustomCursor` (a
  spring-physics ring-and-dot that grows on hovering an interactive
  element). Both mount once in the root layout so every page gets them.
  `CustomCursor` only activates on `(pointer: fine)` devices and adds a
  `custom-cursor-active` class to `<html>` once confirmed active — the
  actual `cursor: none` CSS rule is scoped to both that class *and* an
  `@media (pointer: fine)` guard in `globals.css`, so there's never a
  window where the native cursor is hidden with nothing rendered to
  replace it, and touch devices are entirely unaffected.
- **`useSyncExternalStore`, not `useEffect` + `setState`, for "is this
  mounted on the client" checks.** The React Compiler's lint rule flags a
  direct `setState` call in an effect body as a same-render cascading
  update. Two components need this pattern for the same reason (avoiding a
  hydration mismatch / checking a client-only API once): `ThemeToggle`
  (`src/modules/theme/components/theme-toggle.tsx`) and `CustomCursor.
  useIsFinePointer` (checks `matchMedia`) — copy that pattern rather than
  the classic `useEffect(() => setMounted(true), [])` idiom.
- **Framer Motion + dnd-kit on the same element**: `SortableLinkRow`
  (`src/modules/social-links/components/link-list.tsx`) is both a dnd-kit
  sortable ref (owns `style.transform` for drag positioning) and a
  `motion.li`. `initial`/`animate`/`exit` (one-shot, mount/unmount only)
  coexist fine here — verified live with an actual drag gesture — but a
  *continuously* active transform-based prop like `whileHover={{ scale }}`
  on this same element is a known conflict risk (framer-motion and dnd-kit
  would both be fighting to own `transform` on every frame) and was
  deliberately left out; add hover feedback via non-transform CSS (e.g.
  `hover:shadow-md`, already present) instead.
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
- **Font**: `Plus Jakarta Sans` (`next/font/google`, `src/app/layout.tsx`),
  named `--font-sans` directly on the `variable` option so it plugs straight
  into `globals.css`'s `--font-sans: var(--font-sans)` indirection with no
  edits needed there. Replaced the create-next-app default Geist Sans/Mono
  — Geist Mono was unused (no monospace UI anywhere), so `--font-mono` now
  just falls back to a generic system monospace stack instead of loading an
  unused font.
- **Brand icons**: `simple-icons` resolves a platform's real logo/color
  automatically — `src/modules/social-links/lib/brand-icon.ts` maps a
  curated set of ~28 common platforms (by normalized platform name, falling
  back to the link's URL hostname) to an icon; the `BrandIcon` component
  renders it inside a neutral `bg-muted` circle badge (so brand colors that
  are near-black/near-white, e.g. GitHub, X, still read clearly in both
  themes) with a generic `lucide` `Link2` fallback for anything unmatched.
  The dashboard's create/edit form's "Icon URL" field always wins when set,
  as a manual override for anything not in the curated list — **LinkedIn
  has no icon in `simple-icons`** (removed from the library over brand-
  enforcement requests), so that one always needs the manual override.
  Deliberately curated rather than resolving from the full ~3000-icon set,
  to keep the bundle small.
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
root-caused (possibly an ACL being tuned live on the server side).
**Update while building the Twitch live-badge feature**: this isn't
scoped to ad-hoc scripts after all — an entire dev server session (the
app's own normal long-lived connection) hit `NOPERM` on every single
Redis call, `youtube:latest` included, for the whole session, then a later
session worked fine. So this is intermittent at the whole-connection
level, not something specific to key prefix or caller — treat any
Redis-related dev-session weirdness as "check reachability/ACL state right
now" rather than assuming new code caused it. Still harmless in practice
either way, because every Redis call in the app is written to fail soft
regardless. Because of that history, every Redis call in the app
(`src/lib/redirect-cache.ts`, `src/modules/redirects/service.ts`,
`src/modules/twitch/service.ts`) is written to fail soft: a failed cache
read/write is logged and swallowed,
falling back to the database, never allowed to fail the write/redirect that
triggered it. `src/lib/redis.ts` also caps `maxRetriesPerRequest`/backoff so
a dead Redis degrades gracefully instead of hanging. If Redis-dependent
features seem to silently not cache anything, check reachability from
wherever the app is actually running (and the ACL's permissions) before
assuming a code bug.

## Auth

No public sign-up route — accounts are provisioned by hand via scripts.
`src/modules/auth/server.ts` wires up BetterAuth with the Prisma adapter,
the **admin** plugin (`defaultRole` is `"user"`, but nothing ever creates a
`"user"` row — see roles below), and the **`@better-auth/passkey`** plugin
so any account can sign in with a hardware security key or a passkey
manager like Bitwarden instead of a password (WebAuthn is
authenticator-agnostic — both work the same way from the app's side).
`nextCookies()` must stay last in the `plugins` array.

### Roles

`src/modules/auth/roles.ts` defines the two roles actually used, with
helpers (`isAdmin`, `canAccessDashboard`) consumed by every authorization
check below instead of comparing role strings inline:

- **`admin`** (the owner) — full dashboard access, including the Profile
  tab (public display name/bio/avatar).
- **`moderator`** — can manage Links (the `SocialLink` table is a single
  shared list for the whole site, not per-user — a moderator edits the
  *same* links the owner and every other moderator see, there's no
  per-account link ownership) and their own passkeys (inherently scoped
  per-session by BetterAuth already). Cannot see or edit Profile.

Enforced in three places, all going through `roles.ts` rather than
duplicating the role check: `src/proxy.ts` (redirects to `/sign-in` if
`!canAccessDashboard`), `requireDashboardAccess()` in
`social-links/actions.ts` (both roles), and `requireAdmin()` in
`profile/actions.ts` (admin only). The dashboard page also hides the
Profile *tab* client-side for moderators (`isAdmin(session.user.role)`)
as a UX nicety — the server-side `requireAdmin()` check is what actually
matters for security, the hidden tab just avoids showing a form that
would reject the submit.

- Create/update the owner account: `pnpm create-owner <email> <password>
  [name]` (or `OWNER_EMAIL`/`OWNER_PASSWORD`/`OWNER_NAME` env vars) —
  `scripts/create-owner.ts`, calls `auth.api.signUpEmail` then promotes the
  user to `role: "admin"` via Prisma directly.
- Create a moderator account: `pnpm create-moderator <email> <password>
  [name]` (or `MODERATOR_EMAIL`/`MODERATOR_PASSWORD`/`MODERATOR_NAME` env
  vars) — `scripts/create-moderator.ts`, mirrors `create-owner.ts` but
  promotes to `role: "moderator"` instead. There's no in-dashboard
  "invite a mod" UI; new mod accounts are always provisioned this way.
- `src/proxy.ts` protects `/dashboard/**` by calling
  `auth.api.getSession({ headers })` directly (safe because Next 16's
  `proxy` always runs in the Node.js runtime) and redirecting to `/sign-in`
  when there's no session or the session's role fails
  `canAccessDashboard`.
- The dashboard header shows `session.user.name` (the signed-in account's
  own name) — **not** `profile.displayName` (the site's public-facing
  name shown on the linktree page itself). These were conflated in an
  earlier version, which would have shown the owner's public display name
  to a signed-in moderator instead of the moderator's own name; caught
  while testing this feature, fixed in `src/app/dashboard/page.tsx`.
- Passkey registration/authentication is a real WebAuthn ceremony and can't
  be driven headlessly — verified everything else (redirect-when-signed-out,
  email/password sign-in, dashboard render, sign-out, role-based tab
  visibility) with Playwright scripts against the dev server; the "Add a
  passkey" / "Sign in with a passkey" buttons need a manual check in an
  actual browser with a key or Bitwarden set up. Passkeys are always
  scoped to the signed-in account by BetterAuth, so a moderator managing
  their own passkeys in the Security tab can't see or touch the owner's.
- Passkeys can be named on registration (`authClient.passkey.addPasskey({
  name })`) and renamed/deleted afterward (`authClient.passkey.updatePasskey
  ({ id, name })` / `.deletePasskey({ id })`, in `PasskeyManager`). Neither
  method appears in `@better-auth/passkey`'s `client.d.mts` — they're
  inferred client-side from the server plugin's type rather than hand-
  declared (confirmed by `tsc --noEmit` passing, since static grep alone
  couldn't confirm it); the plugin's own source comments document the exact
  client method names this relies on.
- Local dev and production share the same database — any test account or
  test link created while verifying auth/role changes is immediately live
  on the real site and must be deleted again after testing, not left
  behind.

### Dashboard guide tab

A fourth dashboard tab, `src/app/dashboard/guide.tsx`, visible to both
roles (unlike Profile, which is admin-only) — a plain-English walkthrough
for moderators covering how to add/edit links, the Platform vs. Label
field distinction (Label has no fixed format — it's used for a handle, a
short description, or a `Code: ...`-prefixed partner/referral code
depending on the link), which platform names get an automatic brand icon
and which need a manual Icon URL, groups, subdomain forwards, passkeys,
and what moderators can't do. Built with shadcn's `Accordion`
(`multiple` prop, so several sections can stay open at once) so it's
scannable rather than one long wall of text.

**Deliberately English-only**, unlike every other dashboard string —
the only exception to the i18n module's "every UI string gets both
languages" rule in this codebase. This is a large amount of prose, and
nothing enforces the English/German versions staying in sync as it's
edited (see the i18n section below) — for chrome-sized strings like a
tab label that's a trivial cost, but for a wall of reference text like
this it's a real, compounding maintenance burden, so only the tab label
itself (`Dashboard.tabs.guide`) is translated; the guide's body content
is hardcoded English in `guide.tsx`, not routed through next-intl at
all. If this guide needs a German version later, it needs a real
decision about how to keep it in sync, not just a translation pass.

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
config in production — see the "Dokploy deployment" section below.

**Static subdomain pages** (`STATIC_SUBDOMAIN_PAGES` in `src/proxy.ts`) are
a separate, higher-priority mechanism from the dashboard-driven forwards
above: a hardcoded label → internal path map, checked right after
extracting the hostname's label but before the reserved/forward split, and
rewritten (`NextResponse.rewrite`, not `redirect`) straight to a route in
this app. The browser's URL bar keeps showing the subdomain since it's a
rewrite. No DB row, no dashboard UI, no Redis cache — purely a
`proxy.ts`-level routing rule pointing at a normal `src/app/**` page.
Currently just `onlyfans` → `/onlyfans` (see below); also added to
`RESERVED_SUBDOMAINS` so a dashboard-created link can never claim the same
slug and fight the rewrite for it. Adding another one of these means
adding both the map entry and the reserved-subdomains entry together.

### The `/onlyfans` joke page

Pure frontend parody, no backend at all — every stat/caption in
`src/app/onlyfans/page.tsx` is hardcoded, nothing reads from `Profile` or
`SocialLink`. Colors are hardcoded to match the real OnlyFans light theme
(`#00aff0` accent on white) regardless of the visitor's system dark/light
preference or this app's own theme, since the joke lands better matching
the real thing exactly. `SubscribeButton`
(`src/app/onlyfans/subscribe-button.tsx`) is the only client component on
the page — its click handler just fires a `sonner` toast punchline, no
server action, no real subscription flow of any kind. Verified locally
with `curl -H "Host: onlyfans.aboutselphy.com" http://localhost:3000/`
(same Host-header-spoofing approach as the dashboard-driven forwards
above) rendering the joke page's markup; a Playwright visual screenshot
was attempted but Chromium failed to launch in this dev sandbox on an
unrelated bare-launch test too, so the actual look was confirmed instead
via a screenshot the user took of their own local run.

**Images** (banner, avatar, each of the 6 post covers) are optional
static files under `public/onlyfans/` — `findOnlyFansAsset()`
(`src/app/onlyfans/assets.ts`) does a server-side `fs.existsSync` check
per asset (accepting `.jpg`/`.jpeg`/`.png`/`.webp`, first match wins) and
falls back to the original placeholder (gradient banner, "AS" initials,
emoji+gradient post tile) when a file isn't there yet — same
"render nothing/a placeholder until configured" pattern as
`isYoutubeConfigured()`/`isTwitchConfigured()` elsewhere. Expected paths:
`public/onlyfans/banner.*`, `public/onlyfans/avatar.*`,
`public/onlyfans/posts/1.*` through `posts/6.*`. Post covers render
blurred + darkened (`blur-[3px] brightness-75`) under the lock overlay,
matching a real "locked preview" look. This was the first local static
asset usage in the project (no `public/` directory existed before) —
**images placed here must be committed to git**, since Dokploy builds
straight from the repo; they won't appear in production just by existing
on a local machine.

## Twitch live badge

`src/modules/twitch/` shows a small pulsing red dot on the Twitch link's
icon on the public page when the broadcaster is currently live, and
nothing at all otherwise. Push-based via Twitch's EventSub webhooks, not
polling — `src/app/api/twitch/eventsub/route.ts` receives
`stream.online`/`stream.offline` notifications and writes a boolean into
Redis (`twitch:live`, 12h safety-net TTL in case an offline event is ever
dropped), which `src/app/page.tsx` reads on every request and threads down
through `PublicLinkList` → `LinkRow` as a `twitchLive` prop (matched
against the link whose `platform` is "twitch", case-insensitive). No DB
dependency, and gracefully skips rendering (`isTwitchConfigured()`) when
`TWITCH_BROADCASTER_LOGIN`/`TWITCH_WEBHOOK_SECRET` are unset.

- **Setup is a one-time script, not something the app does itself**: `pnpm
  register-twitch-webhook` (`scripts/register-twitch-webhook.ts`) gets an
  app access token via `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`, looks up
  the broadcaster's numeric id from `TWITCH_BROADCASTER_LOGIN`, and creates
  the two EventSub subscriptions pointed at
  `${NEXT_PUBLIC_SITE_URL}/api/twitch/eventsub`.
- **This can only be run against a deployed, publicly reachable instance,
  never localhost** — Twitch calls the callback URL synchronously during
  registration to verify it's reachable (the
  `webhook_callback_verification` branch in the route handler), so the app
  must already be live at that URL first. `scripts/list-twitch-subscriptions.ts`
  is a read-only helper if a subscription gets stuck
  `webhook_callback_verification_pending`/`_failed`.
- **Signature verification** (`verifyEventSubSignature` in
  `modules/twitch/service.ts`) follows Twitch's spec exactly: HMAC-SHA256
  over `messageId + messageTimestamp + rawBody` using
  `TWITCH_WEBHOOK_SECRET`, compared with `timingSafeEqual`. The route
  handler reads the body with `request.text()` (not `.json()`) specifically
  so the signature is verified against the exact raw bytes Twitch signed,
  before parsing it — re-serializing parsed JSON can produce different
  bytes and silently break verification.
- Verified locally end-to-end short of the real Twitch handshake (which
  needs a public callback, so it can't run against localhost): crafted a
  correctly-signed request by hand and confirmed a bad signature is
  rejected (403), the `webhook_callback_verification` challenge is echoed
  back verbatim, and `stream.online`/`stream.offline` notifications toggle
  the badge. That test run happened to hit the pre-existing Redis `NOPERM`
  flakiness documented above (it affected the already-working YouTube cache
  identically in the same session) — confirmed via server logs that the
  app issued exactly the right Redis commands regardless, so this is that
  known infra issue, not a bug in this feature.

### Diagnosing "the webhook doesn't work" / no logs about it

Two things were missing that made this genuinely hard to debug from
Dokploy's logs alone, both now fixed:

1. **The route logged nothing on success**, only on a Redis failure deep
   inside `service.ts` — a missing/failed subscription produced zero log
   lines anywhere, indistinguishable from "nothing's wrong, it just never
   happens to fire." `src/app/api/twitch/eventsub/route.ts` now logs
   every branch: bad signature (`console.warn`), the verification
   challenge, each notification type received, and revocations (with
   Twitch's given reason).
2. **There was no way to see the *actual* subscription state from inside
   the app** — the running app has no DB row or local record of what was
   registered; that only exists on Twitch's side. Added an admin-only
   dashboard tab, `src/modules/twitch/components/twitch-status.tsx`
   (`Twitch` tab, gated the same as Profile), which queries Twitch's
   Helix API directly (`checkEventSubStatus()` in `service.ts`, same
   token-fetch logic as `scripts/list-twitch-subscriptions.ts`, kept
   separate rather than shared since the scripts aren't part of the app's
   module system) for real subscription status, plus a per-var
   environment-variable checklist. **Fetched purely client-side on tab
   open** (`useEffect`, not during the dashboard's server render) —
   this hits Twitch's API directly, and a slow/down Twitch shouldn't be
   able to slow down the entire dashboard's page load for the admin just
   because this tab exists.

**Root-caused live**: the status tab showed zero subscriptions registered
at all — `pnpm register-twitch-webhook` had never actually been run
against the real production URL. Ran it with `NEXT_PUBLIC_SITE_URL`
overridden to the production domain (the script has no DB/Redis
dependency, only needs the four `TWITCH_*` vars plus that one URL, so
this needed no other production access). Both subscriptions were created
but stayed stuck in `webhook_callback_verification_pending` — a direct
`curl -X POST` to the production callback confirmed the route itself is
reachable and correctly rejects an unsigned request (`403`), which
narrows the pending status down to **the webhook secret used at
registration not matching the `TWITCH_WEBHOOK_SECRET` the running
production app checks against** — those have to be the exact same value
in both places (local `.env`, used to register, and Dokploy's env, used
to verify), and there's no way to tell from Twitch's side that they
differ other than the subscription silently stuck in `pending` (or
`webhook_callback_verification_failed` once Twitch gives up). Confirming
they match, then re-registering, is the next step if this recurs — a
stuck `pending` subscription doesn't self-heal by waiting.

**Regenerated the secret rather than debugging the old one**: the
original `TWITCH_WEBHOOK_SECRET` was a base64-style value containing
`+`/`/`/`=` — this project has already hit exactly this class of bug
before (the MariaDB password needing URL-encoding for the same reason,
see the Prisma 7 section). Rather than chase whether some layer in the
Dokploy/env-var pipeline was mangling those specific characters,
generated a fresh plain-hex secret (`crypto.randomBytes(32).toString
("hex")` — digits and `a`-`f` only, nothing any parser could
misinterpret) and set the exact same value in both local `.env` and
Dokploy, sidestepping the question entirely.

**Actual root cause, found after the secret fix still didn't work**:
even with a confirmed-matching secret, new registrations still failed
verification. Proved the secret/code were both actually fine by
hand-crafting a correctly-signed `webhook_callback_verification`
request from this dev machine and sending it straight to the
production URL — it succeeded (200, challenge echoed back exactly),
which meant the problem was something specific to *Twitch's own
request*, not the app. Cloudflare's Security Events log confirmed it:
**Bot Fight Mode** (`ruleId: "bot_fight_mode"`, `action:
"managed_challenge"`) was intercepting Twitch's delivery
(`userAgent: "Go-http-client/1.1"`, understandably bot-shaped) and
serving it a challenge page instead of routing it to the app — Twitch's
server obviously can't solve a browser challenge, so verification just
silently failed with no error the app itself could ever have logged or
detected. Fixed with a Cloudflare WAF custom rule: `URI Path equals
/api/twitch/eventsub` → **Skip** → Bot Fight Mode, rather than
disabling bot protection for the whole zone. **Lesson for any future
webhook integration on this Cloudflare-proxied domain** (Stripe,
GitHub, etc. would hit the exact same wall): add the same kind of
path-scoped Bot Fight Mode skip rule up front, rather than rediscovering
this from scratch — nothing about it shows up in the app's own logs or
a normal `curl` test, only in Cloudflare's own Security Events log.

`scripts/delete-twitch-subscriptions.ts` (no args deletes every current
subscription, or pass specific ids) was added during this debugging
loop — needed because a stale `pending`/`failed` subscription has to be
removed before a fresh registration for the same type will succeed, and
this came up repeatedly while iterating (secret fix, then the Cloudflare
fix, each needing a clean re-registration).

## SEO & social preview images (OG images)

`src/app/layout.tsx` sets site-wide `Metadata` defaults: `metadataBase`
(resolves relative OG/Twitter image URLs to an absolute one — without it
Next falls back to a localhost URL crawlers can't reach), a title
template (`"%s — AboutSelphy"`), and `openGraph`/`twitter` defaults
(`card: "summary_large_image"`). Per-page metadata overrides these.

**Next's metadata merging does not deep-merge nested objects** like
`openGraph`/`twitter` across layout → page — a page's `twitter` object
entirely replaces the layout's rather than merging into it. Caught this
live: `src/app/page.tsx`'s `generateMetadata()` originally set `twitter:
{ title, description }` without `card`, which silently reverted the
Twitter card type to Next's "summary" default instead of the
`summary_large_image` set in the layout. Any page-level `openGraph`/
`twitter` override needs to repeat every field it cares about, not just
the ones that differ from the layout.

**A page whose own title already reads as a complete sentence including
the site name** (e.g. `/onlyfans`'s "AboutSelphy — definitely a real
subscription page") needs `title: { absolute: "..." }` instead of a plain
string, or the layout's `"%s — AboutSelphy"` template appends the name a
second time. Also caught live via a raw `curl | grep` check of the
rendered `<title>`/`<meta property="og:title">` tags — worth doing that
check on any new page's metadata rather than trusting it visually, since
the duplication doesn't show up anywhere except the actual resolved
`<title>` tag.

**OG images** use Next's file-convention `opengraph-image.tsx` routes
(`next/og`'s `ImageResponse`, powered by Satori — a flexbox-only renderer,
every element needs an explicit `display: "flex"`, there's no default
block layout):

- `src/app/opengraph-image.tsx` — the public profile page's card. Reads
  live `Profile` data (`force-dynamic`, same build-time-Prisma-crash
  reasoning as `page.tsx`) so it always reflects the real display
  name/bio/avatar. The avatar is fetched from `Profile.avatarUrl` (an
  arbitrary external URL) — pre-checked with a plain `fetch()` +
  `res.ok` before referencing it in the image, falling back to an
  initials circle if that URL isn't reachable, rather than letting
  Satori's own image fetch fail and 500 the whole route.
- `src/app/onlyfans/opengraph-image.tsx` — the joke page's card, styled
  to match its OnlyFans-blue theme. Fully static (no DB reads), so it's
  prerendered once at build time rather than per-request. Reuses
  `findOnlyFansAssetDataUri()` (`src/app/onlyfans/assets.ts`) to inline
  the real avatar file as a base64 data URI — a plain relative `<img
  src="/onlyfans/avatar.png">` doesn't work here since Satori has no
  browser to resolve a relative URL against.
- `src/app/onlyfans/icon.tsx` — same `ImageResponse` mechanism, Next's
  file convention for a per-route favicon: gives `/onlyfans` its own
  32×32 blue/lock tab icon instead of inheriting the main site's
  favicon. Solid color + inline SVG only, no font/data dependency, so
  it's prerendered at build time same as the OG image above.
- `src/lib/og-font.ts`'s `loadPlusJakartaSans()` fetches the actual
  Plus Jakarta Sans font file from Google Fonts' CSS2 API at request/
  build time (Satori has no access to `next/font`, fonts must be passed
  in as raw bytes) — subsetted to only the characters actually used, via
  the API's `text=` parameter.
- **Plus Jakarta Sans has no glyphs for symbols like "✓" or emoji like
  "🔒"**, and Satori's own automatic fallback-font fetch for missing
  glyphs isn't reliable at build time — hit this as a real build warning
  (`Failed to download dynamic font`) on the onlyfans OG image, which is
  statically prerendered and so flakiness here would be a permanent part
  of the build, not just an occasional slow request. Fixed by drawing the
  checkmark badge and lock icon as inline SVG paths instead of text/emoji
  characters — no font/network dependency at all for hardcoded content
  like this. Where the text is user-authored and unpredictable (the
  profile bio, in the root OG image), added `emoji: "twemoji"` to that
  `ImageResponse`'s options instead, so Satori renders any emoji as images
  rather than relying on font glyphs.

**`robots.ts`/`sitemap.ts`** (file-convention routes, `src/app/`):
`/dashboard`, `/sign-in`, and `/api/` are disallowed in `robots.txt` and
also carry `robots: { index: false, follow: false }` metadata directly on
those pages (belt-and-suspenders — a crawler ignoring the per-page meta
tag still gets steered away by `robots.txt`). The sitemap deliberately
lists only the public profile page, not `/onlyfans` — that stays
crawlable (nothing blocks it) but isn't actively promoted as a priority
page via the sitemap.

## i18n

`next-intl`, deliberately **without locale-prefixed routing** (no
`/en`/`/de` URL segments) — this app is flat/single-tenant, so path
prefixes would be pure overhead. `next.config.ts` points the plugin at
`./src/modules/i18n/request.ts` (next-intl's default is
`src/i18n/request.ts`; moved to match this project's module layout).

Locale resolution (`src/modules/i18n/request.ts` + `config.ts`): a
`locale` cookie wins if present (manual override); otherwise falls back to
parsing `Accept-Language` (device default) — the server-side equivalent of
how `next-themes` reads `prefers-color-scheme` on the client, just
necessarily server-side here since translated text has to be in the
initial HTML rather than swapped in by CSS. `LocaleSwitcher`
(`src/modules/i18n/components/`) calls a server action to set the cookie,
then `router.refresh()`s.

Messages live in `src/modules/i18n/messages/{en,de}.json`, one JSON tree
per locale, namespaced by area (`SignIn`, `Dashboard.Links`,
`Dashboard.Profile`, `Dashboard.Security`, `PublicProfile`, `Youtube`,
`LocaleSwitcher`) — `useTranslations("Namespace")` in Client Components,
`getTranslations("Namespace")` (async) in Server Components. Adding a UI
string means adding the same key to both JSON files; nothing enforces
that they stay in sync, so check both when touching translated text.

Verified live: `Accept-Language: de-DE` renders German, an unsupported
language (e.g. `fr-FR`) falls back to English, the switcher's manual
override works, and the cookie override persists across a reload even
when the simulated device locale is still German. Side effect worth
knowing: `/` and `/_not-found` became dynamically rendered (were
statically prerendered before this phase) since locale resolution reads
cookies/headers on every request — expected and necessary, not a
regression.

## Dokploy deployment

`Dockerfile` is a three-stage build (`deps` → `builder` → `runner`) on
`node:22-alpine`. Deliberately **not** using `output: 'standalone'`: this
project needs the full `prisma` CLI at container startup (`prisma migrate
deploy` runs before the server starts, applying any migrations not yet
recorded — safe to run on every start), and Next's standalone trace only
picks up what the app code actually `import`s, not CLI binaries invoked as
a subprocess. The `runner` stage instead does a real `pnpm install --prod`
on the same Alpine base as the build, which is simpler and avoids
cross-stage native-binary mismatches for `@prisma/engines` and friends —
image size wasn't worth the added complexity at this project's scale.

**Bug found shipping the `/onlyfans` page's images**: the `runner`
stage's `COPY` list never included `public/`, because that directory
didn't exist anywhere in the project until the onlyfans images feature
added it — `next start` serves static assets from `public/` at runtime,
and `findOnlyFansAsset()`'s `fs.existsSync` check reads from that same
directory, so with it missing entirely from the running container both
silently agreed there were "no images" and fell back to the placeholder,
with no error anywhere. Looked exactly like "haven't added the images
yet" rather than a real bug. Fixed by adding `COPY --from=builder
/app/public ./public` alongside the other `COPY` lines. **Lesson**: any
future top-level directory the app depends on at runtime (`public/`
included) needs an explicit `COPY` line in the `runner` stage — nothing
here infers it automatically, and a missing one fails silently rather
than with a build error, since Docker just proceeds without a directory
that was never asked for in the first place.

`scripts/create-owner.ts` is **not** copied into the runtime image — it
imports the full `src/` source tree (auth/db modules), which the slim
runner deliberately doesn't carry. Create or update the owner account by
running `pnpm create-owner <email> <password>` from a local checkout with
`DATABASE_URL` pointed at the production database — the script only needs
DB access, not to run inside the container.

**Required environment variables in Dokploy** (see `.env.example`):
`DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (the
real `https://social.aboutselphy.com`), `PASSKEY_RP_ID` (`aboutselphy.com`
— must match the real domain or WebAuthn will reject registration/auth),
`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `NEXT_PUBLIC_SITE_URL` (same as
`BETTER_AUTH_URL`), `NEXT_PUBLIC_ROOT_DOMAIN` (`aboutselphy.com`),
`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_BROADCASTER_LOGIN`,
`TWITCH_WEBHOOK_SECRET` (all optional — see the "Twitch live badge"
section below). After deploying with those set, run `pnpm
register-twitch-webhook` locally (against the production `DATABASE_URL`/
env) to actually create the EventSub subscriptions — the env vars alone
don't register anything with Twitch.

**Domain/DNS**: the app listens on port 3000 (`EXPOSE 3000`) inside the
container. Point Dokploy's domain config at this service for both
`social.aboutselphy.com` and a wildcard `*.aboutselphy.com` (needed for the
Phase 5 subdomain forwards — every forward hostname must route to this
same service, since `src/proxy.ts` is what actually resolves and redirects
them) — requires a wildcard DNS record for `*.aboutselphy.com` pointing at
the Dokploy server, plus a matching wildcard domain/rule in Dokploy's
reverse proxy config for this app.

**Docker isn't available in this dev sandbox**, so `docker build` has never
been run here directly — the first real build happened on Dokploy itself,
which caught a bug this sandbox couldn't have: see below. Beyond that,
confidence in the Dockerfile still rests on `pnpm install`, `pnpm exec
prisma generate`, and `pnpm build` having been exercised repeatedly and
successfully in local dev on the same `pnpm-workspace.yaml` build-approval
config — watch for Alpine's musl libc vs. `@prisma/engines`' expected
binary target on the next real deploy, and confirm `pnpm exec prisma
migrate deploy` in the `CMD` doesn't need
`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`-style handling in a non-TTY
container (it shouldn't — `migrate deploy`, unlike `migrate reset`, isn't
gated as a destructive command).

**Bug found on the first real Dokploy build**: `next build` crashed
building `/` with `Cannot read properties of undefined (reading
'prepareCacheLength')` inside `new PrismaMariaDb(...)`. Root cause:
`src/lib/prisma.ts` and `src/lib/redis.ts` both constructed their client
**eagerly at module load** (`export const prisma = ... createClient()`).
Next's build-time page-data-collection step imports every page's module
graph to statically analyze it — which transitively imports these files —
and Dokploy's `docker build` doesn't inject runtime env vars (`DATABASE_URL`
/`REDIS_URL` are only present at container *run* time, via Dokploy's
environment config, not during the build step). So the client constructors
ran with `undefined` connection strings and crashed the entire build, not
just a request. This didn't surface in local dev/`pnpm build` because
`.env` is always present there.

Fixed by making both clients construct lazily, on first real property
access, via a `Proxy` that defers to a memoized singleton (see the comments
in `src/lib/prisma.ts`/`src/lib/redis.ts`) — merely *importing* the module
no longer does anything env-dependent. Also added `export const dynamic =
"force-dynamic"` to `src/app/page.tsx` and `src/app/dashboard/page.tsx`
(they were already effectively dynamic via cookies/headers reads elsewhere
in the tree; this just stops Next from attempting a static-generation probe
that would otherwise still trip the same code path and log a harmless but
confusing caught error during every build). Verified locally by running
`pnpm build` with `DATABASE_URL`/`REDIS_URL` unset — succeeds now (exit 0)
where it previously crashed identically to the Dokploy failure — and by
running `pnpm start` against a normal `.env` afterward to confirm the lazy
client still works correctly for real requests (DB-backed home page, and a
Redis-cached subdomain redirect both returned correctly).

**Lesson for future modules**: any `src/lib/*.ts` singleton that reads an
env var and touches a network client in its construction must defer that
construction past module-evaluation time (the `Proxy` pattern here, or an
equivalent lazy-getter), or it will crash the Docker build the moment any
page imports it — regardless of whether that page ever actually calls it.

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
- [x] Phase 6 — YouTube latest video/short integration: `modules/youtube`
      (Redis-cached, 1h TTL; "Short" classified by duration <= 180s since
      the API exposes no explicit flag), rendered in a `<Suspense>` boundary
      on the public page so a slow/failing YouTube API never blocks the
      rest of it. Verified graceful degradation both when unset and when the
      API call fails, and — once `YOUTUBE_API_KEY`/`YOUTUBE_CHANNEL_ID` were
      set to real values — verified live with real channel data
- [x] Phase 7 — i18n (German/English, device default) — see the dedicated
      section below
- [x] Phase 8 — dark/light theme (device default): `next-themes`,
      `attribute="class"` (matches Tailwind v4's
      `@custom-variant dark (&:is(.dark *))` + the `.dark {}` block shadcn
      already generated in `globals.css`), `defaultTheme="system"`. A
      light/dark/system `ThemeToggle` (`src/modules/theme/components/`) on
      the public page and dashboard for manual override; persisted via
      next-themes' own `localStorage` handling. The hydration-safe "has this
      mounted on the client yet" check uses `useSyncExternalStore` rather
      than the classic `useEffect(() => setMounted(true), [])` idiom — the
      React Compiler's linter flags that pattern as a same-render cascading
      `setState` in an effect. Verified live: device `prefers-color-scheme:
      dark`/`light` both apply with no manual action, a manual toggle
      overrides it, and the override survives a reload.
- [x] Phase 9 — Dockerize for Dokploy — see the dedicated section above.
      All other verification in this project was done live against the
      real dev DB/Redis/browser; this one is the exception — Docker isn't
      available in this dev sandbox, so the `docker build` itself has not
      actually been run. Do a real build before the first production
      deploy.
- [x] Moderator accounts — see the "Roles" subsection under Auth above.
      `roles.ts`, `create-moderator.ts`, dashboard Profile-tab gating, and
      the `session.user.name` vs `profile.displayName` bug fix. Verified
      live with a temporary moderator account (created, exercised, then
      deleted from the shared prod/dev database) via Playwright: dashboard
      redirect/tab visibility per role, link CRUD as a moderator, and that
      the owner's own dashboard is unaffected.
- [x] Link groups — `LinkGroup` model (`prisma/schema.prisma`), one optional
      group per link (`SocialLink.groupId`, `onDelete: SetNull`). Dashboard:
      `GroupFormDialog` (create/rename), `LinkList` renders the ungrouped
      bucket first (no header) followed by named-group sections, each a
      drag-reorderable block (`SortableGroupSection`) with its own nested
      drag-reorderable link list (`LinkBucket`) — groups reorder amongst
      themselves via one `DndContext`, links reorder within their bucket via
      a separate nested one per bucket; links move between buckets only via
      the edit-link form's Group `Select`, never by dragging across buckets.
      Public page (`PublicLinkList`) mirrors the same ungrouped-first,
      named-sections-below layout, hiding any group with zero visible links.
      `order` is scoped per bucket, not global — see `repository.ts`'s
      `nextOrder(groupId)`. Verified live end-to-end (create group, add a
      link into it, rename the group, delete it and confirm the link falls
      back to ungrouped rather than being deleted, public page renders the
      section heading) with temporary test data cleaned up from the shared
      prod/dev database afterward.
- [x] Twitch live badge — see the dedicated section above. Webhook route,
      signature verification, and Redis toggle verified locally with a
      hand-crafted signed request; the real Twitch EventSub handshake still
      needs a live check once registered against the deployed callback URL.
- [x] Public link-list hover animation pass — `PublicLinkList`'s `LinkRow`
      (`src/modules/social-links/components/public-link-list.tsx`) now uses
      Framer Motion variants (`rest`/`hover`/`tap`) instead of a bare CSS
      `hover:bg-muted`: the whole row scales up, lifts, and gains a
      brand-color glow (`boxShadow`) on hover, its icon does a small
      rotate + scale bounce, and the platform label nudges right — all
      declared as variants on the row so the icon/label pick up the
      propagated hover/tap state without each needing its own
      `whileHover` prop. Deliberately scoped to the public page only, not
      the dashboard's draggable `LinkList` — that list's `SortableLinkRow`
      already documents a real transform-ownership conflict between
      continuously-active Framer Motion props and dnd-kit's drag
      positioning (see the Frontend conventions section above), which
      doesn't apply here since this list has no drag-and-drop.
- [x] `onlyfans.aboutselphy.com` joke page — see "Static subdomain pages"
      under Subdomain forwards above. `STATIC_SUBDOMAIN_PAGES` rewrite in
      `proxy.ts`, pure-frontend parody page, no DB/dashboard involvement.
      Verified locally via Host-header spoofing and a screenshot.
- [x] SEO & OG images — see the dedicated section above. `metadataBase`
      + title template + `openGraph`/`twitter` defaults in the root
      layout, `generateMetadata()` on the public page reflecting real
      Profile data, dynamic `opengraph-image.tsx` routes for both the
      public page and the onlyfans joke page, `robots.ts`/`sitemap.ts`.
      Verified live: fetched both generated OG images directly (confirmed
      real 1200x630 PNGs, avatar/branding rendering correctly) and
      grepped the actual rendered `<title>`/`<meta>` tags on `/`,
      `/onlyfans`, and the `/dashboard` → `/sign-in` redirect — caught and
      fixed two real bugs this way (a dropped Twitter card type from
      non-deep-merged metadata, and a duplicated site name in the
      onlyfans page's title) that wouldn't have been obvious from a
      visual check alone.
- [x] Dashboard guide tab — see "Dashboard guide tab" under Auth above.
      A fourth tab (`src/app/dashboard/guide.tsx`) visible to both roles,
      an `Accordion`-based walkthrough for moderators. Deliberately
      English-only body content (only the tab label is translated) —
      see that section for why. Verified live signed in as the owner:
      expanded multiple sections at once, confirmed the label-convention
      examples (handle/description/partner-code) and the LinkedIn
      icon note render correctly.
- [x] Twitch webhook diagnostics + live fix — see "Diagnosing 'the
      webhook doesn't work'" under Twitch live badge above. Admin-only
      dashboard tab querying Twitch's actual EventSub subscription
      status, real logging in the webhook route (previously logged
      nothing on success at all), and `scripts/delete-twitch-
      subscriptions.ts`. Root-caused live through two real issues in
      sequence: a webhook-secret mismatch (fixed by regenerating a
      plain-hex secret rather than debugging the old base64-style one),
      then — the actual final blocker — Cloudflare's **Bot Fight Mode**
      silently challenging Twitch's server-to-server delivery instead of
      routing it through, invisible to both the app's own logs and a
      plain `curl` test, only visible in Cloudflare's Security Events
      log. Fixed with a path-scoped WAF skip rule. Confirmed fully
      working: both `stream.online`/`stream.offline` subscriptions show
      `enabled` on Twitch's side.
