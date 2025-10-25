# Build stage
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

# Install pnpm
RUN npm install -g pnpm@latest

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/apps/api/.next ./apps/api/.next
COPY --from=builder /app/apps/api/public ./apps/api/public
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["pnpm", "start"]
