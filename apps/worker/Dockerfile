# Outbox Worker Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.0.0

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
FROM node:20-alpine AS production

RUN npm install -g pnpm@9.0.0 tsx@4.7.0

WORKDIR /app

# Copy built artifacts
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/worker ./apps/worker
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/package.json ./package.json

WORKDIR /app/apps/worker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Run worker
CMD ["tsx", "outbox-worker.ts"]
