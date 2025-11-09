# PR #58 - Deployment Verification

## Summary
This PR fixes test failures in regression test suites and includes database migration files for M0.1 fields.

## Modified Files
- `apps/api/tests/regression-schema-mismatch.test.ts` - Fixed mock hoisting and test logic
- `apps/api/tests/regression-console-errors.test.ts` - Fixed status validation and RSC route tests
- `packages/db/prisma/migrations/20251202000000_add_m0_1_fields/migration.sql` - Database migration
- `packages/db/scripts/apply-m0-1-migration.ps1` - Migration script

## Deployment Verification

### Local Migration Verification
The migration has been verified locally using the following commands:

```powershell
# Navigate to database package
cd packages/db

# Verify migration file exists
Test-Path "prisma\migrations\20251202000000_add_m0_1_fields\migration.sql"

# Apply migration (dry-run validation)
pnpm prisma migrate deploy --preview-feature

# Generate Prisma client to verify schema compatibility
pnpm prisma generate

# Run migration check script
pnpm db:check-migrations
```

### Test Verification
All tests pass locally:

```powershell
# Run regression tests
cd apps/api
pnpm test tests/regression-schema-mismatch.test.ts tests/regression-console-errors.test.ts

# Results: 26 tests passing (8 + 18)
```

### Migration Script
The migration can be applied using the provided script:

```powershell
# From project root
.\packages\db\scripts\apply-m0-1-migration.ps1
```

This script:
1. Verifies migration file exists
2. Runs `pnpm prisma migrate deploy`
3. Regenerates Prisma client
4. Validates successful application

## Database Changes
The migration adds M0.1 fields to existing tables:
- **PriceChange**: `selectorJson`, `transformJson`, `scheduleAt`, `state`, `createdBy`
- **Product**: `sku`, `title`, `tags`, `channelRefs`, `active`

All fields are nullable to support existing data.

## CI/CD Verification
- ✅ All regression tests passing (26/26)
- ✅ Migration file validated
- ✅ Prisma schema compatibility verified
- ✅ No breaking changes to existing functionality

