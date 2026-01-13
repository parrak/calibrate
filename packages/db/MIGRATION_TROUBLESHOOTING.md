# Migration Troubleshooting Guide

## Error: P3018 - Migration failed to apply

### Case 1: Type Already Exists (e.g., "OutboxStatus" already exists)

#### Symptom
```
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Migration name: 20251126120809_init
Database error code: 42710
Database error: ERROR: type "OutboxStatus" already exists
```

#### Root Cause
The migration is trying to create a type (enum) that already exists in the database. This happens when:
1. The migration was partially applied before failing
2. The database was manually modified
3. A previous deployment partially succeeded

#### Solution

**Option 1: Use API Endpoint (Recommended for Production)**

Check the status:
```bash
curl https://api.calibr.lat/api/migrate/resolve-init
```

Resolve the migration:
```bash
curl -X POST https://api.calibr.lat/api/migrate/resolve-init
```

This will:
- Check if the enum already exists
- Mark the migration as applied if the database state is correct
- Allow subsequent migrations to proceed

**Option 2: Use Script Locally**

```bash
cd packages/db
pnpm migrate:resolve-init
```

**Option 3: Manual Resolution**

If you have direct database access:

1. Connect to your database
2. Run this SQL to mark the migration as applied:
```sql
UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Manually resolved: Objects already exist in database'
WHERE migration_name = '20251126120809_init';
```

3. Then apply remaining migrations:
```bash
cd packages/db
pnpm prisma migrate deploy
```

---

### Case 2: Table Does Not Exist

#### Symptom
```
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Migration name: 20250102000000_add_explain_trace_table
Database error: ERROR: relation "Tenant" does not exist
```

#### Root Cause
The migration is trying to create a foreign key reference to the `Tenant` table, but the base tables don't exist. This happens when:
1. Base migrations (e.g., `20251020035729_add_projects`) haven't been applied
2. The database is in an inconsistent state (migrations marked as applied but tables missing)
3. A previous migration failed, leaving the database in a bad state

#### Solution

#### Step 1: Check Migration Status
```bash
cd packages/db
pnpm prisma migrate status
```

#### Step 2: Check if Migration is Marked as Failed
Connect to your database and run:
```sql
SELECT migration_name, finished_at, applied_steps_count, logs 
FROM "_prisma_migrations" 
WHERE migration_name = '20250102000000_add_explain_trace_table';
```

If `finished_at` is NULL and there are error logs, the migration is marked as failed.

#### Step 3: Resolve the Failed Migration
If the migration is marked as failed, mark it as rolled back:
```bash
cd packages/db
npx prisma migrate resolve --rolled-back 20250102000000_add_explain_trace_table
```

#### Step 4: Check Base Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Tenant', 'Project', 'PriceChange');
```

If these tables don't exist, the base migrations haven't been applied.

#### Step 5: Apply All Migrations
If base tables are missing, you need to apply all migrations from scratch:
```bash
cd packages/db
pnpm prisma migrate deploy
```

This should apply all migrations in order, starting from the first one.

#### Alternative: Reset Database (Development Only!)
⚠️ **WARNING: This will delete all data!**

If you're in a development environment and can afford to lose data:
```bash
cd packages/db
pnpm prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations in order
4. Run seed scripts (if configured)

### Prevention

1. **Always apply migrations in order**: `prisma migrate deploy` handles this automatically
2. **Don't manually modify the database**: Let Prisma manage schema changes
3. **Test migrations locally**: Run `prisma migrate dev` before deploying
4. **Check migration status regularly**: Use `prisma migrate status` to detect drift

### Related Commands

- `pnpm prisma migrate status` - Check which migrations are applied
- `pnpm prisma migrate deploy` - Apply pending migrations (production)
- `pnpm prisma migrate dev` - Create and apply migrations (development)
- `pnpm prisma migrate resolve --rolled-back <name>` - Mark failed migration as rolled back
- `pnpm prisma migrate reset` - Reset database and reapply all migrations (dev only)

