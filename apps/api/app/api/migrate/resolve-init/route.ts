import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

const MIGRATION_NAME = '20251126120809_init'

/**
 * Resolve init migration P3018 error
 *
 * This endpoint handles the case where the 20251126120809_init migration
 * fails because types like "OutboxStatus" already exist in the database.
 *
 * POST /api/migrate/resolve-init
 */
export async function POST() {
  try {
    console.log('🔧 Resolving init migration issue...\n')
    const db = prisma()

    // Check migration status
    console.log(`Checking status of migration: ${MIGRATION_NAME}`)
    const migration = await db.$queryRaw<Array<{
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
      return NextResponse.json({
        success: false,
        message: 'Migration not found in _prisma_migrations table',
        detail: 'The migration may not have been attempted yet.'
      }, { status: 404 })
    }

    const migrationStatus = migration[0]
    const isCompleted = !!migrationStatus.finished_at
    console.log(`   Status: ${isCompleted ? 'Completed' : 'Failed/In Progress'}`)
    console.log(`   Applied steps: ${migrationStatus.applied_steps_count}`)

    if (migrationStatus.logs) {
      console.log(`   Logs: ${migrationStatus.logs}`)
    }

    // Check if OutboxStatus enum exists
    console.log('\nChecking if OutboxStatus enum exists...')
    const enumExists = await db.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'OutboxStatus'
      ) as exists
    `

    if (enumExists[0].exists) {
      console.log('✅ OutboxStatus enum already exists in database')

      // Check if migration is marked as failed
      if (!isCompleted) {
        console.log('\n⚠️  Migration is marked as failed/incomplete')
        console.log('   Since the enum already exists, marking migration as applied...')

        await db.$executeRaw`
          UPDATE "_prisma_migrations"
          SET finished_at = NOW(),
              applied_steps_count = 1,
              logs = 'Manually resolved: Objects already exist in database'
          WHERE migration_name = ${MIGRATION_NAME}
        `

        console.log('✅ Migration marked as applied')

        return NextResponse.json({
          success: true,
          message: 'Migration resolved successfully',
          action: 'marked_as_applied',
          detail: 'Database objects already existed. Migration marked as applied.',
          nextSteps: 'Run prisma migrate deploy to apply remaining migrations'
        })
      } else {
        console.log('✅ Migration is already marked as completed')

        return NextResponse.json({
          success: true,
          message: 'Migration already completed',
          action: 'no_action_needed',
          detail: 'Migration is already marked as completed in the database.'
        })
      }
    } else {
      console.log('❌ OutboxStatus enum does NOT exist in database')

      return NextResponse.json({
        success: false,
        message: 'Database in inconsistent state',
        detail: 'OutboxStatus enum does not exist but migration failed. Database may need manual intervention.',
        recommendation: 'Mark migration as rolled back and reapply: prisma migrate resolve --rolled-back ' + MIGRATION_NAME
      }, { status: 500 })
    }

  } catch (error: unknown) {
    console.error('\n❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Check migration status without making changes
 * GET /api/migrate/resolve-init
 */
export async function GET() {
  try {
    const db = prisma()

    // Check migration status
    const migration = await db.$queryRaw<Array<{
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
      return NextResponse.json({
        success: false,
        migrationName: MIGRATION_NAME,
        found: false,
        message: 'Migration not found in database'
      })
    }

    const migrationStatus = migration[0]

    // Check if OutboxStatus enum exists
    const enumExists = await db.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'OutboxStatus'
      ) as exists
    `

    return NextResponse.json({
      success: true,
      migrationName: MIGRATION_NAME,
      found: true,
      status: {
        completed: !!migrationStatus.finished_at,
        finishedAt: migrationStatus.finished_at,
        appliedSteps: migrationStatus.applied_steps_count,
        logs: migrationStatus.logs
      },
      database: {
        outboxStatusExists: enumExists[0].exists
      },
      needsResolution: !migrationStatus.finished_at && enumExists[0].exists
    })

  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
