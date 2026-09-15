# Modules

This app is a modular monolith: one deployable Next.js app, internally split into
self-contained modules with enforced boundaries.

## Rules

- **Public surface only.** From outside a module's folder, only import its
  `actions.ts` and/or `service.ts` (or an `index.ts` barrel re-exporting those).
  Never import another module's `repository.ts` or internal components.
- **`repository.ts` is Prisma-only and private.** All Prisma queries for a
  module's tables live here. Nothing outside the module imports it.
- **`service.ts` holds business logic** (validation beyond basic zod shape,
  cross-cutting rules like cache invalidation) and calls `repository.ts`.
- **`actions.ts` holds Next.js Server Actions** — the surface dashboard UI calls
  into. Thin wrappers around `service.ts`.
- **`schema.ts`** holds zod schemas for the module's inputs.
- **`components/`** holds the module's own UI. A module may render another
  module's components only if that module exports them from its public surface.
- **`app/` routes stay thin.** Route files call a module's action/service and
  render its components — no business logic or Prisma calls in `app/`.

## Module map

| Module         | Owns                                              | Depends on            |
|----------------|----------------------------------------------------|-----------------------|
| `auth`         | BetterAuth instance, admin plugin, session helpers | —                      |
| `social-links` | `SocialLink` table (CRUD, ordering, dashboard UI)  | —                      |
| `profile`      | Owner display name/bio/avatar                      | —                      |
| `redirects`    | Subdomain → target URL resolution + Redis cache    | `social-links` (read-only, via its service) |
| `youtube`      | Latest video/short fetch + Redis cache             | —                      |
| `i18n`         | next-intl config + message catalogs                | —                      |
| `theme`        | Theme provider wrapper                             | —                      |
