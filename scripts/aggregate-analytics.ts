#!/usr/bin/env node
/**
 * Daily Analytics Aggregation Script
 *
 * Usage:
 *   pnpm aggregate:analytics
 *   node scripts/aggregate-analytics.ts
 *
 * For cron: 0 0 * * * cd /app && pnpm aggregate:analytics
 */

import { aggregateDailySnapshots } from '@calibr/analytics'

async function main() {
  console.log('[Cron] Starting daily analytics aggregation...')
  const startTime = Date.now()

  try {
    const result = await aggregateDailySnapshots({
      includeSales: false, // Enable when sales data available
      includeCompetitorData: false, // Enable when competitor data available
    })

    const duration = Date.now() - startTime

    console.log('[Cron] Aggregation complete:', {
      snapshotsCreated: result.snapshotsCreated,
      projectsProcessed: result.projectsProcessed.length,
      errors: result.errors.length,
      duration: `${duration}ms`,
    })

    if (result.errors.length > 0) {
      console.error('[Cron] Errors encountered:', result.errors)
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('[Cron] Aggregation failed:', error)
    process.exit(1)
  }
}

main()
