# Production Deployment Guide

## Deployment Status

### Production URLs
- API: https://api.calibr.lat (Railway)
- Console: https://console.calibr.lat (Vercel)
- Docs: https://docs.calibr.lat (Vercel)

### Management URLs
- GitHub: https://github.com/parrak/calibrate
- Railway: https://railway.app/project/nurturing-caring
- Vercel: https://vercel.com/dashboard

## Pre-Deployment Checklist

1. ✅ Environment variables set in Railway/Vercel
2. ✅ Database migrations applied
3. ✅ Prisma client generated
4. ✅ CORS origins configured
5. ✅ API routes tested locally

## Deployment Steps

### API (Railway)

1. Push to `master` branch
2. Railway auto-deploys
3. Check Railway logs for errors
4. Verify health endpoint: `https://api.calibr.lat/api/health`

### Console (Vercel)

1. Push to `master` branch
2. Vercel auto-deploys preview
3. Merge to `master` for production
4. Verify: `https://console.calibr.lat`

## Common Deployment Issues

### Next.js 15 Dynamic Params

All dynamic route handlers must await params:
```typescript
const { id } = await context.params;
```

See: `../bug-fixes/nextjs-15-dynamic-params.md`

### Prisma Client Issues

**Problem:** Prisma client not initialized or middleware import errors

**Solution:**
1. Ensure Prisma client is generated before build. On Vercel, the `apps/console/vercel.json` install command now runs:
```bash
corepack prepare pnpm@9.0.0 --activate \
  && cd ../.. \
  && pnpm install --frozen-lockfile=false --shamefully-hoist \
  && pnpm --filter @calibr/db run generate
```

   This executes the workspace `@calibr/db` `generate` script so `@prisma/client` is available before Next.js compiles.

2. If encryption middleware causes issues, disable it:
```typescript
// packages/db/client.ts
// Comment out: import { encryptionMiddleware } from './src/middleware/encryption'
```

### Environment Variables Not Reaching Application (Railway)

**Problem:** Railway variables set but not available to Next.js process

**Solution:** Ensure start script auto-inherits environment:
```bash
# Auto-inherit all environment variables
exec node apps/api/server.js
```

### CORS Issues

Ensure all API routes have `withSecurity` middleware and OPTIONS handlers.

See: `../bug-fixes/cors-configuration.md`

## Monitoring

- Railway: CPU, memory, network metrics
- Vercel: Function executions, bandwidth
- Application: `/api/health` and `/api/metrics` endpoints

