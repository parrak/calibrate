# Calibrate AI Agent Guide

## Project Overview
Calibrate is a multi-tenant pricing automation platform built with Next.js, Prisma, and TypeScript in a monorepo structure. The platform processes price change suggestions through a secure webhook API, evaluates them against configurable policies, and provides an admin console for review.

## Key Architecture Components
- **Monorepo Structure**: Uses `pnpm` workspaces with shared packages under `packages/` and apps under `apps/`
- **Core Services**:
  - `packages/pricing-engine`: Policy evaluation logic (`evaluatePolicy.ts`)
  - `packages/db`: Prisma schema and migrations
  - `packages/security`: HMAC verification and idempotency
  - `packages/connectors`: E-commerce platform integrations
- **Frontend Apps**:
  - `apps/console`: Admin dashboard (Next.js)
  - `apps/api`: Backend API routes
  - `apps/site` & `apps/docs`: Public site and documentation

## Critical Patterns

### Database Schema
- Multi-tenant design with `Tenant` as the root entity
- All major entities (`Project`, `Product`, `Policy`) have tenant isolation
- Example in `packages/db/prisma/schema.prisma`

### Price Policy Evaluation
```typescript
// packages/pricing-engine/evaluatePolicy.ts
evaluatePolicy(currentAmount, proposedAmount, {
  maxPctDelta?: number,  // Maximum % change allowed
  floor?: number,        // Minimum price
  ceiling?: number       // Maximum price
})
```

### Development Workflow
1. Start dependencies: `docker-compose up -d`
2. Install packages: `pnpm install`
3. Generate Prisma client: `pnpm -F db generate`
4. Run dev servers: `pnpm dev`

### Testing
- Use Vitest for unit tests (`*.test.ts`)
- Add tests in the same directory as source files
- Mock external dependencies (database, APIs)

### Common Tasks
- Add new policy rule: Extend `evaluatePolicy.ts` and update Prisma schema
- Create API endpoint: Add route in `apps/api/app/api`
- Update admin UI: Modify components in `apps/console/components`

## Development Process
- **Branch Management**:
  - Create feature branches from `master` for all changes
  - Use descriptive branch names: `feature/policy-budget-limits` or `fix/webhook-validation`
  - Never commit directly to `master`
  - Ensure all tests pass before merging to `master`

- **Testing Requirements**:
  - Write tests alongside new code, not after
  - Update existing tests when modifying functionality
  - Run full test suite before creating PR: `pnpm test`
  - Verify changes in development environment before merging

- **Quality Gates**:
  - All tests must pass in feature branch
  - No regressions in `master` - run test suite after merge
  - Maintain test coverage for new features
  - Review schema changes for backward compatibility

## Configuration Management
- **Environment Variables**:
  - Never hardcode sensitive values or environment-specific config
  - Use `.env.example` files as templates in each package/app
  - Reference environment variables through strongly-typed config modules
  - Example locations:
    - Root: `.env.example`
    - API: `apps/api/.env.local.example`
    - Database: `packages/db/.env.example`

- **Configuration Hierarchy**:
  - Root config for project-wide settings
  - Package-level configs for reusable modules
  - App-specific configs for deployment settings
  - Local overrides via `.env.local` (git-ignored)

## Best Practices
- Always maintain tenant isolation in queries
- Use HMAC verification for webhooks (`packages/security`)
- Implement idempotency for price change operations
- Follow Next.js App Router conventions in all apps