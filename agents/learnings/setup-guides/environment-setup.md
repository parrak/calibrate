# Environment Setup Guide

## Quick Start

1. **Create `.env.local` files** in each app:
   - `apps/api/.env.local`
   - `apps/console/.env.local`
   - `apps/site/.env.local`

2. **Start Database:**
   ```powershell
   docker-compose up -d
   ```

3. **Run Migrations:**
   ```powershell
   pnpm migrate
   ```

4. **Restart Dev Servers:**
   ```powershell
   pnpm dev:all
   ```

## Required Variables

### API Service

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)
- `WEBHOOK_SECRET` - Webhook signature secret (optional)
- `SHOPIFY_API_KEY` - Shopify API key (if using Shopify)
- `SHOPIFY_API_SECRET` - Shopify API secret (if using Shopify)

### Console Service

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_BASE` - API base URL
- `AUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Console URL

### Site Service

- `NEXT_PUBLIC_API_BASE` - API base URL

## Validation

Run environment validation:
```powershell
pnpm env:validate
```

## See Also

- `setup-guides/shopify-integration.md` - Shopify-specific setup
- `bug-fixes/` - Common issues and fixes

