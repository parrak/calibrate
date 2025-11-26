/**
 * GET /api/v1/projects/:projectId/automation-metrics
 * Get automation runner metrics for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { collectWorkerMetrics } from '@calibr/automation-runner'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const db = prisma()
    const projectId = params.projectId
    const { searchParams } = new URL(req.url)
    const sinceParam = searchParams.get('since')

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Parse since parameter
    const since = sinceParam ? new Date(sinceParam) : undefined

    // Collect metrics
    const metrics = await collectWorkerMetrics(projectId, since)

    return NextResponse.json({
      projectId,
      since: since?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        runsProcessed: metrics.runsProcessed,
        targetsApplied: metrics.targetsApplied,
        targetsFailed: metrics.targetsFailed,
        retriesAttempted: metrics.retriesAttempted,
        rate429Errors: metrics.rate429Errors,
        averageDuration: metrics.averageDuration,
        successRate: metrics.successRate,
        dlqSize: metrics.dlqSize,
      },
    })
  } catch (error) {
    console.error('Error collecting automation metrics:', error)
    return NextResponse.json(
      {
        error: 'Failed to collect automation metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
