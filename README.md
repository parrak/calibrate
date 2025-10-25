# Calibrate - Smart Pricing Platform

A comprehensive pricing automation platform built with Next.js, Prisma, and TypeScript in a monorepo structure.

## Architecture

```
calibrate/
├── packages/
│   ├── db/              # Prisma schema, migrations, seed
│   ├── pricing-engine/  # Policy evaluation + apply logic
│   ├── security/        # HMAC + idempotency
│   └── connectors/      # Shopify/Amazon stubs
└── apps/
    ├── api/             # Next.js API routes
    ├── console/         # Admin UI
    ├── site/            # Landing page
    └── docs/            # Documentation
```

## Features

- **Webhook API**: Secure price suggestion submission with HMAC verification
- **Policy Engine**: Configurable pricing rules (max delta, floors, ceilings, daily budgets)
- **Admin Console**: Review and approve price changes
- **Price Versioning**: Full audit trail of price changes
- **Idempotency**: Prevent duplicate processing
- **Multi-tenant**: Support for multiple organizations

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm (recommended) or npm

### 2. Database Setup

```bash
# Using Docker (recommended)
docker-compose up -d

# Or manually create a PostgreSQL database
createdb calibr
```

### 3. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.local.example apps/api/.env.local
cp apps/console/.env.local.example apps/console/.env.local

# Update DATABASE_URL in all .env files
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Database Migration & Seed

```bash
pnpm migrate
pnpm seed
```

### 6. Start Development Servers

```bash
pnpm dev
```

This will start:
- API: http://localhost:3000
- Console: http://localhost:3001
- Site: http://localhost:3002
- Docs: http://localhost:3003

## API Documentation

**📚 Interactive API Documentation:** [https://docs.calibr.lat](https://docs.calibr.lat)

The complete API documentation includes:
- Interactive Swagger UI for testing endpoints
- Detailed request/response schemas
- Authentication and rate limiting information
- Code examples and integration guides

### Quick Reference

**Base URL:** `https://api.calibr.lat`

**Key Endpoints:**
- `POST /api/v1/webhooks/price-suggestion` - Submit price suggestions
- `GET /api/v1/price-changes` - List price changes
- `GET /api/v1/catalog` - Product catalog
- `GET /api/health` - System health check
- `GET /api/metrics` - System metrics
- `GET /api/admin/dashboard` - Admin dashboard data

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @calibr/pricing-engine test
```

## Deployment

### 🚀 Production Status

**All services are currently deployed and operational:**

| Service | Platform | URL | Status |
|---------|----------|-----|--------|
| API | Railway | https://api.calibr.lat | ✅ Live |
| Console | Vercel | https://console.calibr.lat | ✅ Live |
| Site | Vercel | https://calibr.lat | ✅ Live |
| Docs | Vercel | https://docs.calibr.lat | ✅ Live |
| Database | Railway PostgreSQL | (internal) | ✅ Migrated |

**Latest Deployment:** Oct 24, 2025
**Commit:** `1a0532c` - Prisma binary targets fix for Debian

### Railway API Deployment

The API service runs on Railway with PostgreSQL database.

**Configuration:**
- Runtime: Node.js 20 (Debian Slim)
- Build: Docker with Next.js standalone output
- Database: Railway PostgreSQL with Prisma ORM
- Environment Variables:
  - `DATABASE_URL`: Auto-provided by Railway PostgreSQL service
  - `WEBHOOK_SECRET`: Configured in Railway dashboard
  - `NODE_ENV`: production

**Deployment Process:**

```powershell
# Link to Railway project (one-time)
railway login
railway link

# Deploy latest changes
railway redeploy

# Or deploy from local code
railway up
```

**Database Migrations:**

```powershell
# Run migrations on Railway database
railway run -- npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma
```

**Important Notes:**
- Uses `node:20-slim` base image for Prisma compatibility
- Prisma binary target: `debian-openssl-3.0.x`
- Next.js standalone output mode for optimized Docker builds
- Health check endpoint: `/api/health`

**⚠️ CRITICAL Deployment Requirements:**
Before making changes to deployment configuration, read [apps/api/DEPLOYMENT.md](apps/api/DEPLOYMENT.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md#-critical-railway-deployment-constraints) to avoid breaking production. Key constraints:
- **MUST** use `HOSTNAME=0.0.0.0` (not `HOST`) in Dockerfile for Next.js binding
- **MUST** use `debian-openssl-3.0.x` Prisma binary target (not Alpine/musl)
- **DO NOT** add global unique constraints on `Product.code` or `Sku.code`
- See full constraint list in deployment docs

### Vercel Frontend Deployments

Console, Site, and Docs are deployed on Vercel.

**Console Deployment:**

```powershell
cd apps/console
vercel --prod
```

**Environment Variables (set in Vercel):**
- `NEXT_PUBLIC_API_BASE`: https://api.calibr.lat

**Build Configuration:**
- Framework: Next.js
- Build Command: `cd ../.. && pnpm install && pnpm --filter @calibr/console build`
- Output Directory: `apps/console/.next`

### Infrastructure Overview

```
┌─────────────────────────────────────────────┐
│  Users                                       │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│   Vercel    │  │   Railway   │
│             │  │             │
│ - Console   │  │ - API       │
│ - Site      │  │ - PostgreSQL│
│ - Docs      │  │             │
└─────────────┘  └─────────────┘
    │                   │
    └────────┬──────────┘
             │
             ▼
    ┌─────────────────┐
    │ Custom Domains  │
    │                 │
    │ console.calibr  │
    │ api.calibr      │
    │ calibr.lat      │
    │ docs.calibr     │
    └─────────────────┘
```

## Development

### Adding New Packages

1. Create directory in `packages/`
2. Add to `package.json` workspaces
3. Update `tsconfig.json` paths
4. Add to `turbo.json` pipeline

### Database Changes

1. Modify `packages/db/prisma/schema.prisma`
2. Run `pnpm migrate`
3. Update seed data if needed

### API Development

1. Add routes in `apps/api/app/api/`
2. Update Zod schemas in `apps/api/zod/`
3. Add tests in `apps/api/tests/`

## License

MIT
