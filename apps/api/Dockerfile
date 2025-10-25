# Build stage - API only (Debian Slim)
FROM node:20-slim AS builder

# Install required libs and pnpm via corepack
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Ensure Prisma fetches correct engines during install/generate (Debian OpenSSL 3)
ENV PRISMA_DISABLE_POSTINSTALL_GENERATE=true
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/db && pnpm exec prisma generate

# Build the API
RUN cd apps/api && pnpm run build

# Production stage (Debian Slim)
FROM node:20-slim AS runner

# Install required libraries for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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
ENV PORT=8080
ENV HOST=0.0.0.0
ENV PRISMA_DISABLE_POSTINSTALL_GENERATE=true
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
ENV PRISMA_ENGINE_BINARY_TARGET="debian-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Ensure no musl engines are present in the final image
RUN find /app -type f -path "*/.prisma/client/*" -name "*linux-musl*" -print -delete \
 && find /app -type f -path "*/node_modules/@prisma/client/*" -name "*linux-musl*" -print -delete

EXPOSE 8080

# Start the standalone server
CMD ["node", "apps/api/server.js"]

