# Build stage - API only
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@latest

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/db && pnpm exec prisma generate

# Build the API
RUN cd apps/api && pnpm run build

# Production stage
FROM node:20-alpine AS runner

# Install required libraries for Prisma
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static ./apps/api/.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the standalone server
CMD ["node", "apps/api/server.js"]
