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
  database). Workflow used instead for every schema change:
  ```
  pnpm exec prisma migrate diff --from-schema prisma/schema.prisma \
    --to-schema prisma/schema.prisma --script   # (or --from-empty for the very first migration)
  ```
  then hand-create a `prisma/migrations/<timestamp>_<name>/migration.sql`
  with the diff output and apply with `pnpm exec prisma migrate deploy`
  (which doesn't need shadow-DB permissions). In practice: diff the *old*
  schema state (via `--from-migrations prisma/migrations`) against the new
  `schema.prisma` to get an incremental script, not a from-empty one, once
  the first migration already exists.
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
  `@hookform/resolvers/zod` directly.

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
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `YOUTUBE_API_KEY`,
`YOUTUBE_CHANNEL_ID`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`. The
user provides `DATABASE_URL` and `REDIS_URL` directly — no local Docker
Postgres/Redis containers for dev.

## Subdomain forwards

`src/proxy.ts` inspects the `Host` header. If the hostname's subdomain isn't
the root app domain (`social`, `www`, apex, `localhost`), it asks the
`redirects` module to resolve that subdomain against the dashboard-managed
`SocialLink.subdomain` field (Redis-cached, Postgres-backed) and redirects to
the resolved target URL, or falls through to the main site if unconfigured.
Requires wildcard DNS (`*.aboutselphy.com`) and matching Dokploy domain
config — document the exact steps here once Dokploy is set up (Phase 9).

## Feature status

- [x] Phase 0 — repo, Next.js scaffold, shadcn/ui, Framer Motion, module
      skeleton, Redis client, CLAUDE.md
- [x] Phase 1 — Prisma schema (auth tables, `Profile`, `SocialLink`),
      migrated against the real DB
- [ ] Phase 2 — BetterAuth + admin plugin, dashboard route protection
      (`src/modules/auth/server.ts` already has a minimal config used to
      generate the schema; still needs the route handler, sign-in page, and
      dashboard route protection)
- [ ] Phase 3 — `social-links` + `profile` modules, dashboard CRUD
- [ ] Phase 4 — public profile page
- [ ] Phase 5 — data-driven subdomain redirects (`proxy.ts` + `redirects` module)
- [ ] Phase 6 — YouTube latest video/short integration
- [ ] Phase 7 — i18n (German/English, device default)
- [ ] Phase 8 — dark/light theme (device default)
- [ ] Phase 9 — Dockerize for Dokploy
