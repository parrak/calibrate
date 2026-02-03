# Outbox Worker Dockerfile
FROM node:20-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Ensure Prisma uses Debian OpenSSL 3 engines
ENV PRISMA_DISABLE_POSTINSTALL_GENERATE=true
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy packages
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @calibr/db prisma generate

# Build packages
RUN pnpm --filter @calibr/monitor build
RUN pnpm --filter @calibr/db build

# Production stage
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.0.0 tsx@4.7.0

ENV PRISMA_DISABLE_POSTINSTALL_GENERATE=true
ENV PRISMA_ENGINE_BINARY_TARGET="debian-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

WORKDIR /app

# Copy built artifacts
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/worker ./apps/worker
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/tsconfig.json ./tsconfig.json

WORKDIR /app/apps/worker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port=process.env.PORT||3001; require('http').get('http://localhost:'+port+'/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));" || exit 1

# Run worker
CMD ["tsx", "outbox-worker.ts"]
