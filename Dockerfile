# Build stage - API only (Alpine)
FROM node:20-alpine AS builder

# Install required libs and pnpm via corepack
RUN apk add --no-cache openssl ca-certificates \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Ensure Prisma fetches correct engines during install/generate
ENV PRISMA_DISABLE_POSTINSTALL_GENERATE=true
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl,debian-openssl-3.0.x"

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/db && pnpm exec prisma generate

# Build the API
RUN cd apps/api && pnpm run build

# Production stage (Alpine)
FROM node:20-alpine AS runner

# Install required libraries for Prisma (include OpenSSL 1.1 compat for musl engine)
RUN apk add --no-cache openssl ca-certificates compat-openssl1.1

# Install Prisma CLI globally for running migrations pre-deploy
RUN npm i -g prisma@5.22.0

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static ./apps/api/.next/static

# Copy Prisma schema and migrations for migrate deploy
COPY --from=builder /app/packages/db/prisma /app/prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Set environment
ENV NODE_ENV=production
ENV PRISMA_DISABLE_POSTINSTALL_GENERATE=true
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl,debian-openssl-3.0.x"
ENV PRISMA_ENGINE_BINARY_TARGET="linux-musl"
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Ensure Prisma engines exist (no deletion on musl)

EXPOSE 8080

# Start the standalone server
CMD ["node", "apps/api/server.js"]
# redeploy-bump 2025-10-25T00:28:18.3814808-07:00
