# Calibrate Development Guides

Quick reference guides for common development tasks in the Calibrate monorepo.

## Table of Contents

1. [Database Operations](#database-operations)
2. [Connector Development](#connector-development)
3. [API Development](#api-development)
4. [Frontend Development](#frontend-development)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Database Operations

### Creating a Migration

```bash
# 1. Update schema
vim packages/db/prisma/schema.prisma

# 2. Create and apply migration
pnpm migrate

# 3. Generate Prisma client
pnpm db:generate
```

### Adding a New Model

```prisma
// packages/db/prisma/schema.prisma

model MyNewModel {
  id        String   @id @default(uuid())
  name      String
  status    Status   @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([name, status])
}
```

**Critical Rules:**
- ⚠️ NEVER add global unique constraints on `Product.code` or `Sku.code`
- ✅ Always add `createdAt` and `updatedAt` timestamps
- ✅ Use enums for status fields
- ✅ Use `@default(uuid())` for IDs

### Seeding Data

```typescript
// packages/db/seed.ts
import { db } from './client';

async function main() {
  // Seed your data here
  await db.myNewModel.create({
    data: {
      name: 'Example',
      status: 'ACTIVE',
    },
  });
}

main();
```

### Viewing Data

```bash
# Open Prisma Studio
pnpm db:studio

# Or query directly
pnpm --filter @calibr/db ts-node scripts/query.ts
```

---

## Connector Development

### Creating a New Connector

1. **Create package structure:**
```bash
mkdir packages/my-connector
cd packages/my-connector
```

2. **Create package.json:**
```json
{
  "name": "@calibr/my-connector",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest"
  },
  "dependencies": {
    "@calibr/platform-connector": "workspace:*"
  }
}
```

3. **Implement interfaces:**
```typescript
// src/MyConnector.ts
import { PlatformConnector, ProductOperations, PricingOperations } from '@calibr/platform-connector';

export class MyConnector implements PlatformConnector {
  async initialize(credentials: any): Promise<void> {
    // Initialize connection
  }
  
  // Implement required methods
}
```

4. **Register connector:**
```typescript
// src/index.ts
import { ConnectorRegistry } from '@calibr/platform-connector';

ConnectorRegistry.register('my-platform', async (config, credentials) => {
  const connector = new MyConnector(config, credentials);
  if (credentials) {
    await connector.initialize(credentials);
  }
  return connector;
});
```

### Adding API Routes

```typescript
// apps/api/app/api/platforms/my-platform/route.ts

import { ConnectorRegistry } from '@calibr/platform-connector';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const connector = await ConnectorRegistry.createConnector('my-platform', config);
    // Use connector...
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Adding Console UI

```typescript
// apps/console/app/my-platform/page.tsx

export default function MyPlatformPage() {
  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

---

## API Development

### Creating a New API Route

1. **Create route file:**
```typescript
// apps/api/app/api/my-feature/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@calibr/db';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  value: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    
    // Database operation
    const result = await db.myModel.create({
      data,
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
```

2. **Add tests:**
```typescript
// apps/api/tests/my-feature.test.ts

import { test, expect } from 'vitest';
import request from 'supertest';

test('POST /api/my-feature', async () => {
  const response = await request(app)
    .post('/api/my-feature')
    .send({ name: 'Test', value: 42 });
    
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

### Adding Validation

```typescript
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
});

const updateSchema = createSchema.partial();
```

### Using Database Transactions

```typescript
const result = await db.$transaction(async (tx) => {
  const item1 = await tx.model1.create({ data: { ... } });
  const item2 = await tx.model2.create({ 
    data: { ...item1 } 
  });
  return { item1, item2 };
});
```

---

## Frontend Development

### Creating a New Page

```typescript
// apps/console/app/my-feature/page.tsx

import { db } from '@calibr/db';
import { Button } from '@calibr/ui';

export default async function MyFeaturePage() {
  const data = await db.myModel.findMany();
  
  return (
    <div>
      <h1>My Feature</h1>
      {/* Your UI here */}
    </div>
  );
}
```

### Creating a Client Component

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui';

export function MyClientComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <Button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </Button>
  );
}
```

### Using the UI Library

```typescript
import { Button, Card, Table } from '@calibr/ui';

export function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Submit</Button>
      <Table data={data} columns={columns} />
    </Card>
  );
}
```

---

## Testing

### Writing Unit Tests

```typescript
// packages/my-package/src/myFeature.test.ts

import { test, expect } from 'vitest';
import { myFunction } from './myFeature';

test('myFunction works correctly', () => {
  expect(myFunction('input')).toBe('expected output');
});
```

### Writing Integration Tests

```typescript
// apps/api/tests/integration/myFeature.test.ts

import { test, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../app/api';

test('integration test', async () => {
  const response = await request(app)
    .post('/api/my-feature')
    .send({ data: 'test' });
    
  expect(response.status).toBe(200);
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @calibr/my-package test

# Run tests in watch mode
pnpm --filter @calibr/my-package test --watch

# Run tests with coverage
pnpm --filter @calibr/my-package test --coverage
```

---

## Deployment

### Deploying to Railway (API)

```bash
# Link to Railway project
railway login
railway link

# Deploy
railway up

# Or redeploy latest
railway redeploy

# Run migrations
railway run -- npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma
```

### Deploying to Vercel

```bash
# Link project
vercel link --project console --yes

# Deploy to production
vercel --prod --yes

# Deploy to preview
vercel
```

### Pre-Deployment Checklist

- [ ] All tests passing: `pnpm test`
- [ ] Local build successful: `pnpm build`
- [ ] Lockfile committed: `pnpm-lock.yaml`
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Documentation updated

---

## Troubleshooting

### "Module not found" errors

```bash
# Clean install
rm -rf node_modules
pnpm install

# Check workspace dependencies
pnpm list --depth 0
```

### Prisma Client errors

```bash
# Regenerate client
pnpm db:generate

# Reset database
pnpm --filter @calibr/db prisma migrate reset

# Check schema
pnpm --filter @calibr/db prisma validate
```

### Build cache issues

```bash
# Clear Turbo cache
rm -rf .turbo

# Clear Next.js cache
rm -rf apps/*/.next

# Rebuild
pnpm build
```

### Type errors

```bash
# Check for TypeScript errors
pnpm run typecheck

# Regenerate types
pnpm db:generate
```

### Test failures

```bash
# Run specific test
pnpm test -- myTest

# Run tests with verbose output
pnpm test -- --reporter=verbose

# Clear test cache
rm -rf node_modules/.vitest
```

---

## Quick Commands Reference

### Development
```bash
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all code
```

### Database
```bash
pnpm migrate          # Run migrations
pnpm seed             # Seed database
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma Client
```

### Deployment
```bash
pnpm staging:deploy   # Deploy to staging
pnpm docs:deploy      # Deploy docs
pnpm staging:test     # Test staging
```

### Package Management
```bash
pnpm --filter @calibr/db <command>    # Run command for specific package
pnpm add -w <package>                 # Add to workspace root
pnpm add --filter @calibr/api <pkg>  # Add to specific package
```

---

For more information, see:
- **README.md** - Project overview
- **.cursorrules** - Development rules and patterns
- **ARCHITECTURE_DIAGRAM.md** - System architecture

