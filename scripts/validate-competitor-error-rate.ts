/**
 * Competitor Monitoring Error Rate Validation Script
 *
 * Validates that competitor scraping error rate is below 1% per 24h across all tenants.
 * This script can be run manually or as part of CI/CD to ensure M0.6 acceptance criteria.
 *
 * Usage:
 *   pnpm tsx scripts/validate-competitor-error-rate.ts
 *   pnpm tsx scripts/validate-competitor-error-rate.ts --threshold=1 --hours=24
 */

import { PrismaClient } from '@prisma/client'

interface ErrorRateMetrics {
  tenantId: string
  projectId: string
  totalAttempts: number
  totalErrors: number
  errorRate: number
  failedCompetitors: Array<{
    name: string
    consecutiveFailures: number
    lastChecked: Date | null
  }>
  staleCompetitors: Array<{
    name: string
    lastChecked: Date | null
  }>
}

interface ValidationResult {
  success: boolean
  overallErrorRate: number
  tenantMetrics: ErrorRateMetrics[]
  summary: {
    totalTenants: number
    totalAttempts: number
    totalErrors: number
    tenantsAboveThreshold: number
    threshold: number
  }
}

/**
 * Calculate error rate metrics for competitor monitoring
 */
async function calculateErrorRateMetrics(
  db: PrismaClient,
  hours: number = 24
): Promise<ErrorRateMetrics[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)
  const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Get all projects with competitors
  const projects = await db.project.findMany({
    where: {
      Competitor: {
        some: {
          isActive: true
        }
      }
    },
    include: {
      Competitor: {
        where: { isActive: true },
        include: {
          CompetitorProduct: {
            where: { isActive: true },
            include: {
              CompetitorPrice: {
                where: {
                  createdAt: { gte: since }
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      }
    }
  })

  const metrics: ErrorRateMetrics[] = []

  for (const project of projects) {
    let totalAttempts = 0
    let totalErrors = 0
    const failedCompetitors: Array<{
      name: string
      consecutiveFailures: number
      lastChecked: Date | null
    }> = []
    const staleCompetitors: Array<{
      name: string
      lastChecked: Date | null
    }> = []

    for (const competitor of project.Competitor) {
      // Count products as attempts
      const productCount = competitor.CompetitorProduct.length
      totalAttempts += productCount

      // Check for failed products (no recent prices)
      let consecutiveFailures = 0
      for (const product of competitor.CompetitorProduct) {
        if (product.CompetitorPrice.length === 0) {
          totalErrors++
          consecutiveFailures++
        }
      }

      // Track competitors with consecutive failures (3+)
      if (consecutiveFailures >= 3) {
        failedCompetitors.push({
          name: competitor.name,
          consecutiveFailures,
          lastChecked: competitor.lastChecked
        })
      }

      // Track stale competitors (not checked in 24h)
      if (!competitor.lastChecked || competitor.lastChecked < staleThreshold) {
        staleCompetitors.push({
          name: competitor.name,
          lastChecked: competitor.lastChecked
        })
      }
    }

    const errorRate = totalAttempts > 0 ? (totalErrors / totalAttempts) * 100 : 0

    metrics.push({
      tenantId: project.tenantId,
      projectId: project.id,
      totalAttempts,
      totalErrors,
      errorRate,
      failedCompetitors,
      staleCompetitors
    })
  }

  return metrics
}

/**
 * Validate competitor monitoring error rate
 */
async function validateCompetitorErrorRate(
  threshold: number = 1,
  hours: number = 24
): Promise<ValidationResult> {
  const db = new PrismaClient()

  try {
    const tenantMetrics = await calculateErrorRateMetrics(db, hours)

    // Calculate overall metrics
    const totalAttempts = tenantMetrics.reduce((sum, m) => sum + m.totalAttempts, 0)
    const totalErrors = tenantMetrics.reduce((sum, m) => sum + m.totalErrors, 0)
    const overallErrorRate = totalAttempts > 0 ? (totalErrors / totalAttempts) * 100 : 0

    // Count tenants above threshold
    const tenantsAboveThreshold = tenantMetrics.filter(m => m.errorRate > threshold).length

    const success = overallErrorRate <= threshold

    return {
      success,
      overallErrorRate,
      tenantMetrics,
      summary: {
        totalTenants: tenantMetrics.length,
        totalAttempts,
        totalErrors,
        tenantsAboveThreshold,
        threshold
      }
    }
  } finally {
    await db.$disconnect()
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const thresholdArg = args.find(arg => arg.startsWith('--threshold='))
  const hoursArg = args.find(arg => arg.startsWith('--hours='))

  const threshold = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : 1
  const hours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24

  console.log('🔍 Validating Competitor Monitoring Error Rate...')
  console.log(`   Threshold: ${threshold}%`)
  console.log(`   Time window: ${hours} hours`)
  console.log()

  const result = await validateCompetitorErrorRate(threshold, hours)

  console.log('📊 Overall Metrics:')
  console.log(`   Total Tenants: ${result.summary.totalTenants}`)
  console.log(`   Total Attempts: ${result.summary.totalAttempts}`)
  console.log(`   Total Errors: ${result.summary.totalErrors}`)
  console.log(`   Overall Error Rate: ${result.overallErrorRate.toFixed(2)}%`)
  console.log(`   Tenants Above Threshold: ${result.summary.tenantsAboveThreshold}`)
  console.log()

  if (result.summary.tenantsAboveThreshold > 0) {
    console.log('⚠️  Tenants with Error Rate Above Threshold:')
    for (const metric of result.tenantMetrics) {
      if (metric.errorRate > threshold) {
        console.log(`   - Tenant: ${metric.tenantId}`)
        console.log(`     Project: ${metric.projectId}`)
        console.log(`     Error Rate: ${metric.errorRate.toFixed(2)}%`)
        console.log(`     Attempts: ${metric.totalAttempts}, Errors: ${metric.totalErrors}`)

        if (metric.failedCompetitors.length > 0) {
          console.log(`     Failed Competitors (${metric.failedCompetitors.length}):`)
          for (const comp of metric.failedCompetitors) {
            console.log(`       - ${comp.name}: ${comp.consecutiveFailures} consecutive failures`)
          }
        }

        if (metric.staleCompetitors.length > 0) {
          console.log(`     Stale Competitors (${metric.staleCompetitors.length}):`)
          for (const comp of metric.staleCompetitors) {
            console.log(`       - ${comp.name}: last checked ${comp.lastChecked?.toLocaleString() || 'never'}`)
          }
        }
        console.log()
      }
    }
  }

  if (result.success) {
    console.log(`✅ VALIDATION PASSED: Error rate (${result.overallErrorRate.toFixed(2)}%) is below threshold (${threshold}%)`)
    process.exit(0)
  } else {
    console.log(`❌ VALIDATION FAILED: Error rate (${result.overallErrorRate.toFixed(2)}%) exceeds threshold (${threshold}%)`)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running validation:', error)
    process.exit(1)
  })
}

export { validateCompetitorErrorRate, calculateErrorRateMetrics }
