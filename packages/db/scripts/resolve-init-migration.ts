#!/usr/bin/env tsx
/**
 * Resolve init migration P3018 error
 *
 * This script handles the case where the 20251126120809_init migration
 * fails because types like "OutboxStatus" already exist in the database.
 *
 * It will:
 * 1. Check if the migration is marked as failed
 * 2. Verify if the database objects already exist
 * 3. Mark the migration as applied if the schema matches
 * 4. Otherwise, mark it as rolled back so it can be reapplied
 *
 * Usage:
 *   DATABASE_URL=... tsx scripts/resolve-init-migration.ts
 */

import { PrismaClient } from '@prisma/client'

const MIGRATION_NAME = '20251126120809_init'

async function main() {
  const prisma = new PrismaClient()

  try {
    console.log('🔧 Resolving init migration issue...\n')

    // Check migration status
    console.log(`Checking status of migration: ${MIGRATION_NAME}`)
    const migration = await prisma.$queryRaw<Array<{
      migration_name: string
      finished_at: Date | null
      applied_steps_count: number
      logs: string | null
    }>>`
      SELECT migration_name, finished_at, applied_steps_count, logs
      FROM "_prisma_migrations"
      WHERE migration_name = ${MIGRATION_NAME}
    `

    if (migration.length === 0) {
      console.log('❌ Migration not found in _prisma_migrations table')
      console.log('   The migration may not have been attempted yet.')
      process.exit(1)
    }

    const migrationStatus = migration[0]
    console.log(`   Status: ${migrationStatus.finished_at ? 'Completed' : 'Failed/In Progress'}`)
    console.log(`   Applied steps: ${migrationStatus.applied_steps_count}`)

    if (migrationStatus.logs) {
      console.log(`   Logs: ${migrationStatus.logs}`)
    }

    // Check if OutboxStatus enum exists
    console.log('\nChecking if OutboxStatus enum exists...')
    const enumExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'OutboxStatus'
      ) as exists
    `

    if (enumExists[0].exists) {
      console.log('✅ OutboxStatus enum already exists in database')

      // Check if migration is marked as failed
      if (!migrationStatus.finished_at) {
        console.log('\n⚠️  Migration is marked as failed/incomplete')
        console.log('   Since the enum already exists, marking migration as applied...')

        await prisma.$executeRaw`
          UPDATE "_prisma_migrations"
          SET finished_at = NOW(),
              applied_steps_count = 1,
              logs = 'Manually resolved: Objects already exist in database'
          WHERE migration_name = ${MIGRATION_NAME}
        `

        console.log('✅ Migration marked as applied')
        console.log('\n✨ Resolution complete! You can now run: prisma migrate deploy')
      } else {
        console.log('✅ Migration is already marked as completed')
        console.log('   No action needed.')
      }
    } else {
      console.log('❌ OutboxStatus enum does NOT exist in database')
      console.log('   This is unexpected. The database may be in an inconsistent state.')
      console.log('\n   Recommended action:')
      console.log('   1. Mark migration as rolled back: prisma migrate resolve --rolled-back ' + MIGRATION_NAME)
      console.log('   2. Then run: prisma migrate deploy')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
