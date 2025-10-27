# Cursor Usage Guide for Calibrate

This guide explains how to effectively use Cursor AI in the Calibrate monorepo development workflow.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Workspace Structure](#workspace-structure)
3. [Common Development Tasks](#common-development-tasks)
4. [AI-Assisted Development](#ai-assisted-development)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Understanding the Project

Before starting, familiarize yourself with:
- **README.md** - Overall project structure and quick start
- **ARCHITECTURE_DIAGRAM.md** - Current architecture and component status
- **PHASE3_ROADMAP.md** - Development roadmap and priorities
- **.cursorrules** - Cursor-specific rules and patterns

### Key Commands

```bash
# Development
pnpm dev              # Start all services in parallel
pnpm build            # Build all packages
pnpm test             # Run all tests

# Database
pnpm migrate          # Run Prisma migrations
pnpm seed             # Seed the database
pnpm db:studio        # Open Prisma Studio

# Deployment
pnpm staging:deploy   # Deploy to staging
pnpm docs:deploy      # Deploy documentation
```

## Workspace Structure

### Monorepo Layout

```
calibrate/
├── .cursor/          # Cursor-specific files
│   ├── README.md     # This file
│   └── GUIDES.md     # Quick reference guides
├── packages/         # Shared packages
│   ├── db/           # Database schema and migrations
│   ├── platform-connector/  # Platform abstraction
│   ├── shopify-connector/   # Shopify integration
│   └── amazon-connector/   # Amazon integration
└── apps/             # Applications
    ├── api/          # Backend API
    ├── console/      # Admin UI
    ├── site/         # Landing page
    └── docs/         # Documentation
```

### Key Directories

- **packages/db/** - Database schema, migrations, seed data
- **packages/platform-connector/** - Connector interface definitions
- **packages/shopify-connector/** - Shopify connector implementation
- **packages/amazon-connector/** - Amazon SP-API connector
- **apps/api/** - Next.js API routes and business logic
- **apps/console/** - Next.js admin interface

## Common Development Tasks

### Adding a New Feature

1. **Plan the feature** - Understand requirements and architecture
2. **Create/update package** - Add to appropriate package
3. **Add database changes** - Update Prisma schema if needed
4. **Implement logic** - Write code with TypeScript
5. **Add tests** - Write unit and integration tests
6. **Update API** - Add API routes if needed
7. **Update UI** - Add frontend components if needed
8. **Test locally** - Run `pnpm test` and `pnpm run verify:local`
9. **Deploy** - Follow deployment checklist

### Working with Database

```bash
# 1. Update schema
vim packages/db/prisma/schema.prisma

# 2. Create migration
pnpm migrate

# 3. Update seed data (if needed)
vim packages/db/seed.ts
pnpm seed

# 4. Verify changes
pnpm db:studio
```

### Working with Connectors

1. Navigate to connector package: `packages/shopify-connector/` or `packages/amazon-connector/`
2. Update connector source files in `src/`
3. Implement required interfaces:
   - `AuthOperations` - OAuth and authentication
   - `ProductOperations` - Product CRUD operations
   - `PricingOperations` - Price updates
4. Register connector in `src/index.ts`
5. Test connector: `pnpm --filter @calibr/shopify-connector test`

### Working with API Routes

1. Navigate to `apps/api/app/api/`
2. Create route handler (e.g., `my-feature/route.ts`)
3. Add Zod validation schemas
4. Use Prisma client for database operations
5. Handle errors appropriately
6. Add tests in `apps/api/tests/`

## AI-Assisted Development

### Using Cursor Chat

Cursor Chat is most effective when you:

1. **Provide context** - Mention relevant files and current state
2. **Be specific** - Ask targeted questions
3. **Reference patterns** - Point to similar existing code
4. **Iterate** - Refine requests based on results

### Example Prompts

✅ **Good Prompts:**
```
"Add a new API endpoint for managing webhook subscriptions following 
the pattern in apps/api/app/api/webhooks/route.ts"
```

```
"Create a test for the ShopifyConnector.createProduct method similar 
to the test in packages/shopify-connector/tests/connector.test.ts"
```

```
"Update the database schema to add a 'status' field to PlatformIntegration 
model following the existing enum pattern"
```

❌ **Bad Prompts:**
```
"Fix the code" (too vague)
```

```
"Add something to the API" (not specific)
```

### Using Cursor Composer

Cursor Composer is ideal for:

1. **Multi-file changes** - Updating multiple related files
2. **Refactoring** - Systematically changing patterns
3. **Testing** - Generating test files from source
4. **Documentation** - Creating docs from code

**When to use:**
- Making consistent changes across files
- Adding tests for existing code
- Refactoring similar functions
- Creating documentation

### Code Citations

When showing code, always use proper citations:

**For existing code:**
```12:25:packages/shopify-connector/src/ShopifyConnector.ts
export class ShopifyConnector implements PlatformConnector {
  // ... code here
}
```

**For new code:**
```typescript
export class MyNewClass {
  // ... new code
}
```

## Best Practices

### 1. Stay in Context

Always provide context when asking Cursor to:
- Modify existing code
- Add new features
- Fix bugs
- Refactor code

Reference specific files and line numbers when possible.

### 2. Follow Patterns

Study existing code before creating new code:
- Use similar patterns and structures
- Follow naming conventions
- Match error handling approaches
- Use same testing patterns

### 3. Test Frequently

After each significant change:
1. Run `pnpm test` to catch regressions
2. Run `pnpm run verify:local` for integration tests
3. Test affected functionality manually

### 4. Update Documentation

When adding features:
- Update README if needed
- Add JSDoc comments to public APIs
- Update architecture docs if structure changes
- Create migration guides for breaking changes

### 5. Respect Deployment Constraints

Always check `apps/api/DEPLOYMENT.md` before:
- Changing Dockerfile
- Modifying Prisma configuration
- Adding database constraints
- Changing environment variables

### 6. Use Type Safety

- Define proper TypeScript types
- Use Zod for runtime validation
- Avoid `any` types
- Use strict mode enabled in tsconfig

## Troubleshooting

### Cursor Not Understanding Context

**Problem:** Cursor generates code that doesn't fit your patterns

**Solution:**
- Reference specific files and functions
- Show examples of similar code
- Mention specific requirements
- Provide more context about the codebase

### Build Failures

**Problem:** Code doesn't compile after Cursor changes

**Solution:**
```bash
# Clear caches
rm -rf .turbo
rm -rf apps/*/.next
rm -rf packages/*/dist
rm -rf node_modules

# Reinstall and rebuild
pnpm install
pnpm build
```

### Database Issues

**Problem:** Database schema out of sync

**Solution:**
```bash
# Reset database
pnpm --filter @calibr/db prisma migrate reset

# Apply migrations
pnpm migrate

# Regenerate client
pnpm db:generate
```

### Test Failures

**Problem:** Tests fail after changes

**Solution:**
1. Run tests to see errors: `pnpm test`
2. Check for TypeScript errors: `pnpm run typecheck`
3. Verify test data is correct
4. Check for missing dependencies

## Quick Reference

### File Locations

| Component | Location |
|-----------|----------|
| Database Schema | `packages/db/prisma/schema.prisma` |
| Database Migrations | `packages/db/prisma/migrations/` |
| API Routes | `apps/api/app/api/` |
| Connector Interfaces | `packages/platform-connector/src/interfaces/` |
| Shopify Connector | `packages/shopify-connector/src/` |
| Amazon Connector | `packages/amazon-connector/src/` |
| UI Components | `packages/ui/components/` |
| Tests | `*/tests/` or `*.test.ts` |

### Common Paths

```typescript
// Import database client
import { db } from '@calibr/db'

// Import platform interfaces
import { PlatformConnector } from '@calibr/platform-connector'

// Import UI components
import { Button, Card } from '@calibr/ui'

// Import pricing engine
import { evaluatePolicy } from '@calibr/pricing-engine'
```

### Environment Variables

Check these files for required variables:
- Root: `.env.example`
- Database: `packages/db/.env.example`
- API: `apps/api/.env.local.example`
- Console: `apps/console/.env.local.example`

---

For more detailed guides, see:
- **GUIDES.md** - Quick reference for specific tasks
- **ARCHITECTURE_DIAGRAM.md** - Component relationships
- **PHASE3_ROADMAP.md** - Development priorities

