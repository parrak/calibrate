# Build stage (Debian Slim)
FROM node:20-slim AS builder

# Use Corepack to install a PNPM version compatible with the lockfile
# Lockfile is version 9.0 -> use PNPM v9
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Ensure Prisma fetches correct engines during install/generate (Debian OpenSSL 3)
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

# Required libraries for Prisma runtime and Corepack
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable 
RUN if [ ! -e /usr/lib/libssl.so.1.1 ] && [ -e /usr/lib/libssl.so.3 ]; then ln -s /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1; fi \
 && if [ ! -e /usr/lib/libcrypto.so.1.1 ] && [ -e /usr/lib/libcrypto.so.3 ]; then ln -s /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1; fi
RUN if [ ! -e /lib/libssl.so.1.1 ] && [ -e /lib/libssl.so.3 ]; then ln -s /lib/libssl.so.3 /lib/libssl.so.1.1; fi \
 && if [ ! -e /lib/libcrypto.so.1.1 ] && [ -e /lib/libcrypto.so.3 ]; then ln -s /lib/libcrypto.so.3 /lib/libcrypto.so.1.1; fi

WORKDIR /app

# Copy built application and dependencies
# Prefer Next.js standalone output for smaller runtime images
# If your build is configured for standalone, copy that; otherwise keep previous block.
COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static ./apps/api/.next/static

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
ENV PRISMA_ENGINE_BINARY_TARGET="debian-openssl-3.0.x"

WORKDIR /app

EXPOSE 3000

# Start standalone server
CMD ["node", "apps/api/server.js"]
