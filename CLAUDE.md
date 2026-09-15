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
- Prisma ORM on PostgreSQL
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
pnpm dlx prisma migrate dev      # apply migrations locally
pnpm dlx prisma studio           # inspect the DB
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
- [ ] Phase 1 — Prisma schema (auth tables, `Profile`, `SocialLink`)
- [ ] Phase 2 — BetterAuth + admin plugin, dashboard route protection
- [ ] Phase 3 — `social-links` + `profile` modules, dashboard CRUD
- [ ] Phase 4 — public profile page
- [ ] Phase 5 — data-driven subdomain redirects (`proxy.ts` + `redirects` module)
- [ ] Phase 6 — YouTube latest video/short integration
- [ ] Phase 7 — i18n (German/English, device default)
- [ ] Phase 8 — dark/light theme (device default)
- [ ] Phase 9 — Dockerize for Dokploy
