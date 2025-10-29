# Calibrate - Smart Pricing Platform

A comprehensive pricing automation platform built with Next.js, Prisma, and TypeScript in a monorepo structure.

Note for AI agents: See `AGENTS.md` for repository-wide rules and per-app guides.

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

### Core Pricing Platform
- **Webhook API**: Secure price suggestion submission with HMAC verification
- **Policy Engine**: Configurable pricing rules (max delta, floors, ceilings, daily budgets)
- **Admin Console**: Review and approve price changes
- **Price Versioning**: Full audit trail of price changes
- **Idempotency**: Prevent duplicate processing
- **Multi-tenant**: Support for multiple organizations

### Competitor Monitoring (Phase 2 - ✅ Complete)
- **Web Scraping**: Automated competitor price tracking across Shopify, Amazon, Google Shopping
- **Market Analytics**: Real-time market positioning and price comparison insights
- **Competitor Rules**: Automated pricing strategies based on competitor data
- **Price History**: Track competitor price changes over time
- **Multi-channel Support**: Monitor competitors across different sales channels

See [COMPETITOR_MONITORING.md](COMPETITOR_MONITORING.md) for detailed documentation.

### Platform Integrations (Phase 3 - 🚧 In Planning)
- **Shopify Integration**: OAuth authentication, product sync, and automated price updates
- **Amazon Integration**: SP-API connection, catalog sync, and price feed submission
- **Platform Abstraction**: Unified interface for connecting to any e-commerce platform
- **Automated Sync**: Two-way synchronization between Calibrate and external platforms
- **Multi-platform Management**: Manage pricing across multiple sales channels from one dashboard

See [PHASE3_ROADMAP.md](PHASE3_ROADMAP.md) for detailed roadmap and architecture.

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

## OAuth & Platform Integration Env Vars

Add these to `apps/api/.env.local` (and Railway for production):

Shopify
- `SHOPIFY_API_KEY=...`
- `SHOPIFY_API_SECRET=...`
- `SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders` (adjust as needed)
- `SHOPIFY_WEBHOOK_SECRET=...`

Amazon SP-API (LWA)
- `AMAZON_SP_APP_ID=amzn1.sp.solution.xxxxx` (Seller Central App ID)
- `AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx`
- `AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxx`

Console/URLs
- `NEXT_PUBLIC_API_BASE=https://api.calibr.lat` (or local API URL)
- `NEXT_PUBLIC_CONSOLE_URL=https://console.calibr.lat` (for redirects)

## OAuth Flows

Shopify
- Install URL: `GET /api/integrations/shopify/oauth/install?project_id=<slug>&shop=<shopDomain>`
- Callback: `GET /api/integrations/shopify/oauth/callback?...` — exchanges code, upserts integration, redirects back to Console.

Amazon (LWA)
- Install URL: `GET /api/platforms/amazon/oauth/install?project=<slug>` — returns Seller Central consent URL.
- Callback: `GET /api/platforms/amazon/oauth/callback?...` — exchanges code via LWA, upserts integration, redirects back to Console.
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

Console, Site, and Docs are deployed on Vercel as separate projects with a monorepo root. Important notes for agents:

- Vercel uses a workspace install with `pnpm install --frozen-lockfile` in CI. If you add or change dependencies in any sub-app, run `pnpm install` at repo root and commit the updated `pnpm-lock.yaml` or builds will fail with ERR_PNPM_OUTDATED_LOCKFILE.
- Some Next.js builds require Tailwind/PostCSS packages at runtime. Install `tailwindcss`, `postcss`, and `autoprefixer` as production dependencies for apps that use global Tailwind (site/docs).
- For monorepo projects with “Root Directory” set in Vercel, deploy from repo root after linking to the specific project: `vercel link --project <name>` then `vercel --prod`.

**Console**

```powershell
# from repo root
vercel link --project console --yes
vercel --prod --yes
```

Env (Vercel Project → Settings → Environment Variables):
- `NEXT_PUBLIC_API_BASE` = https://api.calibr.lat

**Site (calibrate-site)**

```powershell
# from repo root
vercel link --project calibrate-site --yes
vercel --prod --yes
```

Notes:
- Next CI type check can require TypeScript packages even if errors are ignored. `@calibr/site` includes `typescript`, `@types/react`, `@types/node` as prod deps and sets `ignoreBuildErrors`/`ignoreDuringBuilds` in `next.config.js`.

**Docs**

```powershell
# from repo root
vercel link --project docs --yes
vercel --prod --yes
```

Notes:
- Ensure Tailwind/PostCSS are in dependencies. If modified, update and commit the root lockfile.

Monorepo tip: if the Vercel project mis-detects the Next.js app or expects a static output directory (e.g., error about missing `public`), add a `vercel.json` to the app to force the framework and commands. Example for `apps/site/vercel.json`:

```
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "cd ../.. && pnpm --filter @calibr/site build",
  "outputDirectory": ".next"
}
```

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
