# Calibrate — Composable Pricing Data OS (E-Comm Wedge)

Calibr is a **composable pricing data platform** with an **e-commerce wedge**:
we ship a **reliable bulk & rule-based pricing control plane** for Shopify first,
with explainability, governance, and multi-tenant safety — built on a schema-
and event-driven core that later extends to Amazon (read-only) and Stripe (conditional).

**Read this first (source of truth):**

`/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md` •
`/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md` •
`/agents/docs/_EXECUTION_PACKET_V2/02_TEAM_ASSIGNMENTS.md`

> Note for AI/agent contributors: when direction is unclear, consult the files above.

## Architecture

```
calibrate/
├── packages/
│   ├── db/ # Prisma + JSON schema registry, RLS, migrations, seeds
│   ├── pricing-engine/ # Rules DSL, preview -> approve/apply -> rollback
│   ├── connectors/ # Shopify (read/write), Amazon (read-only stub, feature-flagged)
│   ├── security/ # HMAC, idempotency, auth helpers
│   ├── monitor/ # @calibr/monitor (req IDs, p95, error %, health)
│   └── types/ # @calibr/types (generated DTOs via CI)
└── apps/
    ├── api/ # Next.js API (OpenAPI, event outbox)
    ├── console/ # Merchant console (catalog, rules, diff preview, audit)
    ├── site/ # Marketing + SaaS collector (passive validation)
    └── docs/ # Documentation
```

## Features

### Core Pricing Platform (V2 E-Comm Wedge)
- **Rules Engine**: Selector + transform (%/absolute, floors/ceilings), schedule, dry-run
- **Governance Flow**: `preview → approve/apply → rollback` (human-in-the-loop)
- **Explainability & Audit**: Every change emits `explain_trace` + `audit_event`
- **Evented Core**: Append-only `event_log` + outbox; idempotent, retry/backoff
- **Multi-tenant Safety**: RLS on core tables; scoped tokens; per-tenant secrets
- **Copilot (Read-Only)**: NL→SQL/GraphQL queries over pricing data with logging

### Integrations (aligned with V2 plan)
- **Shopify (Launch)**: OAuth + product/variant ingest; **price update write-back**
- **Amazon (Read-Only Stub)**: SP-API OAuth + catalog ingest **only** (feature-flagged); no write in MVP
- **Stripe (Conditional)**: Activates **after SaaS validation gate** (see `/agents/docs/_EXECUTION_PACKET_V2/05_STRIPE_INTEGRATION_PLAN.md`)

> Older competitive scraping or broad "Phase 3" plans are **deprecated** for MVP and moved to backlog.

## Quick Start

### Option 1: One-Step Setup (Recommended)

```bash
pnpm setup
```

This runs:
- Preflight checks (Node.js, pnpm, Docker)
- DB up via Docker Compose
- Env files scaffold + validation
- Install deps; generate Prisma client; run migrations
- Optional seed
- Publish `@calibr/types` locally and enable RLS

### Option 2: Manual Setup

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

### 3. Environment Setup (core + connectors)

```bash
# Copy environment files (if they exist)
# Or create them manually with the required variables

# Update DATABASE_URL in all .env files

## OAuth & Platform Integration Env Vars (Shopify launch; Amazon stub)

Add these to `apps/api/.env.local` (and Railway for production):

Shopify
- `SHOPIFY_API_KEY=...`
- `SHOPIFY_API_SECRET=...`
- `SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders` (adjust as needed)
- `SHOPIFY_WEBHOOK_SECRET=...`

Amazon SP-API (LWA) — **read-only stub; feature-flagged**
- `AMAZON_SP_APP_ID=amzn1.sp.solution.xxxxx` (Seller Central App ID)
- `AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx`
- `AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxx`
- `AMAZON_CONNECTOR_ENABLED=false`  # toggle true only in dev/staging during schema tests

Console/URLs
- `NEXT_PUBLIC_API_BASE=https://api.calibr.lat` (or local API URL)
- `NEXT_PUBLIC_CONSOLE_URL=https://console.calibr.lat` (for redirects)

## OAuth Flows (Shopify live; Amazon stubbed)

Shopify
- Install URL: `GET /api/integrations/shopify/oauth/install?project_id=<slug>&shop=<shopDomain>`
- Callback: `GET /api/integrations/shopify/oauth/callback?...` — exchanges code, upserts integration, redirects back to Console.

Amazon (LWA) — **stubbed**
- Install URL: `GET /api/platforms/amazon/oauth/install?project=<slug>` — returns Seller Central consent URL.
- Callback: `GET /api/platforms/amazon/oauth/callback?...` — exchanges code via LWA, upserts integration, redirects back to Console.

> No write/sync in MVP; used to stress test schema + ingest.
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

**Key Endpoints (wedge)**
- `GET /api/v1/catalog` — Product catalog
- `GET /api/v1/price-changes` — Price change proposals (filters, pagination)
- `POST /api/v1/price-changes/:id/(approve|apply|reject|rollback)` — Governance actions
- `GET /api/health` — System health
- `GET /api/metrics` — System metrics
- `POST /copilot/query` — NL→SQL/GraphQL (read-only)

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

> Ensure Prisma OpenSSL target and RLS remain intact. See deployment docs below.

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
- **DO NOT** add global unique constraints on `Product.code` or `Sku.code` (breaks multi-channel ingest)
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

## Source of Truth for Direction

When in doubt, read:

- `/agents/docs/_EXECUTION_PACKET_V2/00_EXEC_SUMMARY.md`
- `/agents/docs/_EXECUTION_PACKET_V2/01_MILESTONES.md`
- `/agents/docs/_EXECUTION_PACKET_V2/02_TEAM_ASSIGNMENTS.md`

## License

MIT

