# Calibrate Quick Reference Card

**🚀 One-page cheat sheet for Calibrate development**

## Project Structure

```
calibrate/
├── packages/          # Shared packages
│   ├── db/           # Database (Prisma)
│   ├── platform-connector/  # Platform abstraction
│   ├── shopify-connector/   # Shopify integration
│   └── amazon-connector/   # Amazon integration
└── apps/             # Applications
    ├── api/          # Backend API (port 3000)
    ├── console/      # Admin UI (port 3001)
    ├── site/         # Landing (port 3002)
    └── docs/         # Docs (port 3003)
```

## Essential Commands

```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm test             # Run all tests

# Database
pnpm migrate          # Run migrations
pnpm seed             # Seed database
pnpm db:studio        # Open Prisma Studio

# Deployment
pnpm staging:deploy   # Deploy to staging
pnpm docs:deploy      # Deploy docs
```

## Critical Rules ⚠️

1. **NEVER skip database migrations** - Always run `pnpm migrate` after schema changes
2. **NEVER break production** - Check `apps/api/DEPLOYMENT.md` first
3. **ALWAYS run tests** - Run `pnpm test` after changes
4. **Keep environment variables separate** - Don't skip adding env vars during build

## Technology Stack

- **TypeScript** - Strict mode enabled
- **Next.js 14** - App Router
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **pnpm** - Package manager
- **Turborepo** - Build system

## Database

**Schema:** `packages/db/prisma/schema.prisma`  
**Migrations:** `packages/db/prisma/migrations/`

```bash
# Create migration
pnpm migrate

# Seed database
pnpm seed

# Open Prisma Studio
pnpm db:studio
```

## API Routes

**Location:** `apps/api/app/api/`

**Key Endpoints:**
- `POST /api/v1/webhooks/price-suggestion` - Price suggestion
- `GET /api/v1/price-changes` - List changes
- `POST /api/platforms/shopify/auth` - Shopify OAuth
- `GET /api/health` - Health check

## Imports

```typescript
// Database
import { db } from '@calibr/db';

// Platform connectors
import { ConnectorRegistry } from '@calibr/platform-connector';

// UI components
import { Button, Card } from '@calibr/ui';

// Pricing engine
import { evaluatePolicy } from '@calibr/pricing-engine';

// Security
import { verifyHmac } from '@calibr/security';
```

## Adding Features

1. Update schema (if needed): `packages/db/prisma/schema.prisma`
2. Run migration: `pnpm migrate`
3. Add logic: Update appropriate package
4. Add API route: `apps/api/app/api/`
5. Add tests: `*.test.ts` files
6. Test: `pnpm test`
7. Deploy: Follow deployment checklist

## Deployment URLs

| Service | URL |
|---------|-----|
| API | https://api.calibr.lat |
| Console | https://console.calibr.lat |
| Site | https://calibr.lat |
| Docs | https://docs.calibr.lat |

## Troubleshooting

**Build fails:**
```bash
rm -rf .turbo && rm -rf apps/*/.next
pnpm install && pnpm build
```

**Database issues:**
```bash
pnpm db:generate
pnpm migrate
```

**Tests fail:**
```bash
pnpm test -- --reporter=verbose
```

## File Locations

| Component | Location |
|-----------|----------|
| Database Schema | `packages/db/prisma/schema.prisma` |
| API Routes | `apps/api/app/api/` |
| Shopify Connector | `packages/shopify-connector/src/` |
| Amazon Connector | `packages/amazon-connector/src/` |
| UI Components | `packages/ui/` |
| Tests | `*.test.ts` or `tests/` |

## Quick Tips

✅ **Do:**
- Follow existing patterns
- Add JSDoc comments
- Write tests for new code
- Run migrations after schema changes
- Check deployment constraints

❌ **Don't:**
- Skip database migrations
- Add global unique constraints on `Product.code` or `Sku.code`
- Use `HOST` instead of `HOSTNAME` in Dockerfile
- Deploy without testing
- Commit without running tests

## Documentation

- **README.md** - Project overview
- **.cursorrules** - Development rules
- **.cursor/README.md** - Cursor guide
- **.cursor/GUIDES.md** - Development guides
- **.cursor/ARCHITECTURE.md** - Architecture reference
- **.cursor/PROJECT_STATUS.md** - Current status

## Common Tasks

**Add a new model:**
```prisma
model MyModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Add an API route:**
```typescript
// apps/api/app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true });
}
```

**Add a test:**
```typescript
// *.test.ts
import { test, expect } from 'vitest';
test('my test', () => {
  expect(true).toBe(true);
});
```

---

**Need more help?** Check the full documentation in `.cursor/` directory or refer to ARCHITECTURE.md

