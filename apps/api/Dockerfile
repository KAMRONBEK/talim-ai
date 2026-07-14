# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

# Full dependency tree (dev + prod) — only used to compile TS / run prisma generate.
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# Production-only dependency tree that ships to the runner. Excludes the dev
# toolchain (typescript, tsx, eslint, @types/*) — the bulk of the old ~1.4GB
# image — while keeping `prisma` (now a prod dep) so the container self-migrates.
# `--filter @talim/api...` scopes the install to the api + ONLY its (workspace)
# deps, so unrelated workspace packages' deps (e.g. packages/ui's tailwind
# toolchain, which the api never imports) don't leak into the runtime image.
# Prisma's client is generated HERE so the generated code + query engine land in
# this prod-only node_modules (the runtime imports them).
FROM base AS prod-deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prod --filter @talim/api...
COPY apps/api/src/prisma ./apps/api/src/prisma
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY packages/types ./packages/types
WORKDIR /app/packages/types
RUN pnpm build
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules
# openssl for Prisma; poppler-utils provides `pdftoppm` (the PDF→image rasterizer
# used for scanned-PDF OCR) — a CLI tool, so no fragile native node bindings.
RUN apk add --no-cache openssl poppler-utils
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/src/prisma ./src/prisma
# Production-only node_modules (dev toolchain stripped) — the size win.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/package.json ./root-package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN mkdir -p /uploads
EXPOSE 4000
CMD ["sh", "-c", "./apps/api/node_modules/.bin/prisma migrate deploy --schema=src/prisma/schema.prisma && node dist/index.js"]
