/**
 * Cron Job Heartbeat Monitoring API
 * Endpoint for managing cron job heartbeats and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  registerCronJob,
  unregisterCronJob,
  recordCronHeartbeat,
  getCronJobStatus,
  getAllCronJobStatuses,
  checkCronJobHealth,
  type CronJobConfig,
  type CronHeartbeat,
  type CronJobStatus
} from '@calibr/monitor'

/**
 * GET /api/admin/cron
 * Get all cron job statuses or specific job status
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const jobId = url.searchParams.get('jobId')
    const healthCheck = url.searchParams.get('healthCheck') === 'true'

    if (healthCheck) {
      // Get health check results
      const health = checkCronJobHealth()

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: health.missing.length + health.failed.length + health.unreliable.length + health.healthy.length,
          missing: health.missing.length,
          failed: health.failed.length,
          unreliable: health.unreliable.length,
          healthy: health.healthy.length
        },
        missing: health.missing.map(formatJobStatus),
        failed: health.failed.map(formatJobStatus),
        unreliable: health.unreliable.map(formatJobStatus),
        healthy: health.healthy.map(formatJobStatus)
      })
    }

    if (jobId) {
      // Get specific job status
      const status = getCronJobStatus(jobId)
      if (!status) {
        return NextResponse.json({
          error: 'Cron job not found',
          message: `No cron job found with ID: ${jobId}`
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        job: formatJobStatus(status)
      })
    }

    // Get all job statuses
    const allStatuses = getAllCronJobStatuses()
    const statusesArray = Array.from(allStatuses.values())

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      jobs: statusesArray.map(formatJobStatus),
      total: statusesArray.length
    })
  } catch (error) {
    console.error('Failed to get cron job statuses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get cron job statuses',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/cron
 * Register a cron job, record a heartbeat, or unregister a job
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, jobId, config, heartbeat } = body

    // Register a new cron job
    if (action === 'register' && config) {
      const cronConfig: CronJobConfig = {
        id: config.id,
        name: config.name,
        description: config.description,
        schedule: config.schedule,
        expectedIntervalMs: config.expectedIntervalMs,
        gracePeriodMs: config.gracePeriodMs,
        alertOnMiss: config.alertOnMiss
      }

      registerCronJob(cronConfig)

      return NextResponse.json({
        success: true,
        message: 'Cron job registered successfully',
        jobId: cronConfig.id
      })
    }

    // Unregister a cron job
    if (action === 'unregister' && jobId) {
      unregisterCronJob(jobId)

      return NextResponse.json({
        success: true,
        message: 'Cron job unregistered successfully',
        jobId
      })
    }

    // Record a heartbeat
    if (action === 'heartbeat' && heartbeat) {
      const cronHeartbeat: CronHeartbeat = {
        jobId: heartbeat.jobId,
        timestamp: heartbeat.timestamp || Date.now(),
        status: heartbeat.status,
        duration: heartbeat.duration,
        message: heartbeat.message,
        error: heartbeat.error,
        metadata: heartbeat.metadata
      }

      recordCronHeartbeat(cronHeartbeat)

      return NextResponse.json({
        success: true,
        message: 'Heartbeat recorded successfully',
        jobId: cronHeartbeat.jobId
      })
    }

    return NextResponse.json({
      error: 'Invalid action',
      message: 'Supported actions: register, unregister, heartbeat'
    }, { status: 400 })
  } catch (error) {
    console.error('Failed to process cron job action:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process cron job action',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Helper to format job status for API response
 */
function formatJobStatus(status: CronJobStatus) {
  return {
    jobId: status.jobId,
    name: status.config.name,
    description: status.config.description,
    schedule: status.config.schedule,
    expectedIntervalMs: status.config.expectedIntervalMs,
    lastHeartbeat: status.lastHeartbeat
      ? {
          timestamp: new Date(status.lastHeartbeat.timestamp).toISOString(),
          status: status.lastHeartbeat.status,
          duration: status.lastHeartbeat.duration,
          message: status.lastHeartbeat.message,
          error: status.lastHeartbeat.error
        }
      : null,
    lastSuccessfulRun: status.lastSuccessfulRun
      ? new Date(status.lastSuccessfulRun).toISOString()
      : null,
    lastFailedRun: status.lastFailedRun
      ? new Date(status.lastFailedRun).toISOString()
      : null,
    consecutiveFailures: status.consecutiveFailures,
    totalRuns: status.totalRuns,
    successfulRuns: status.successfulRuns,
    failedRuns: status.failedRuns,
    avgDuration: Math.round(status.avgDuration),
    isMissing: status.isMissing,
    nextExpectedRun: new Date(status.nextExpectedRun).toISOString(),
    reliability: Math.round(status.reliability * 100) / 100
  }
}
