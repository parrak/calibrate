-- Script to check and fix Prisma migration state
-- Run this if migrations are failing because base tables don't exist

-- Check which migrations Prisma thinks have been applied
SELECT migration_name, finished_at, applied_steps_count 
FROM "_prisma_migrations" 
ORDER BY started_at;

-- Check if base tables exist
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tenant') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as tenant_table_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Project') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as project_table_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PriceChange') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as pricechange_table_status;

-- If base tables are missing but migrations are marked as applied, 
-- you may need to reset the migration state:
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20250102000000_add_explain_trace_table';
-- Then run: pnpm prisma migrate deploy

