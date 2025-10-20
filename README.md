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

## API Endpoints

### Webhooks
- `POST /api/v1/webhooks/price-suggestion` - Submit price suggestions

### Price Changes
- `GET /api/v1/price-changes` - List price changes
- `POST /api/v1/price-changes/{id}/approve` - Approve a change
- `POST /api/v1/price-changes/{id}/apply` - Apply a change
- `POST /api/v1/price-changes/{id}/reject` - Reject a change

### Catalog
- `GET /api/v1/catalog?productCode=PRO` - Get product information

### Health
- `GET /api/healthz` - Health check

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @calibr/pricing-engine test
```

## Deployment

### Vercel (Recommended)

1. Create separate Vercel projects for each app:
   - `calibr-api` → `apps/api`
   - `calibr-console` → `apps/console`
   - `calibr-site` → `apps/site`
   - `calibr-docs` → `apps/docs`

2. Set environment variables in each project:
   - `DATABASE_URL`
   - `WEBHOOK_SECRET`
   - `NEXT_PUBLIC_API_BASE` (for console)

3. Deploy:
   ```bash
   pnpm build
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
