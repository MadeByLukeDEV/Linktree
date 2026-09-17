# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (incl. devDependencies, needed to build) ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: generate the Prisma client and build the Next.js app ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# ---- runner: production-only deps + the build output ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
ENV PORT=3000

# Applies any pending migrations (safe/idempotent -- migrate deploy only
# runs migrations not yet recorded) before starting the server.
#
# The owner account is NOT created inside this image: scripts/create-owner.ts
# imports the full src/ source tree (auth/db modules), which this slim
# runtime image deliberately doesn't carry. Run `pnpm create-owner
# <email> <password>` from a local checkout with DATABASE_URL pointed at
# production instead -- the script only needs DB access, not to run inside
# the container.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]
