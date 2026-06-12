# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

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
RUN apk add --no-cache openssl
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/src/prisma ./src/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/package.json ./root-package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN mkdir -p /uploads
EXPOSE 4000
CMD ["sh", "-c", "./apps/api/node_modules/.bin/prisma migrate deploy --schema=src/prisma/schema.prisma && node dist/index.js"]
