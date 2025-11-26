/**
 * GET /api/v1/projects/:projectId/automation-metrics
 * Get automation runner metrics for a project
 * TODO: Implement full metrics collection with @calibr/automation-runner
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import type { RuleRun, RuleTarget } from '@calibr/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(req.url)
    const sinceParam = searchParams.get('since')

    // Verify project exists
    const project = await prisma().project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Parse since parameter
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get runs for the project
    const runs: Array<RuleRun & { RuleTarget: RuleTarget[] }> = await prisma().ruleRun.findMany({
      where: {
        projectId,
        createdAt: {
          gte: sinceDate,
        },
      },
      include: {
        RuleTarget: true,
      },
    })

    // Calculate basic metrics
    const runsProcessed = runs.filter(
      (r) => r.status === 'APPLIED' || r.status === 'PARTIAL' || r.status === 'FAILED'
    ).length

    let targetsApplied = 0
    let targetsFailed = 0
    runs.forEach((run) => {
      targetsApplied += run.RuleTarget.filter((t) => t.status === 'APPLIED').length
      targetsFailed += run.RuleTarget.filter((t) => t.status === 'FAILED').length
    })

    const totalTargets = targetsApplied + targetsFailed
    const successRate = totalTargets > 0 ? (targetsApplied / totalTargets) * 100 : 0

    // Get DLQ size
    const dlqSize = await prisma().ruleTarget.count({
      where: {
        projectId,
        status: 'FAILED',
      },
    })

    return NextResponse.json({
      projectId,
      since: sinceDate.toISOString(),
      metrics: {
        runsProcessed,
        targetsApplied,
        targetsFailed,
        successRate,
        dlqSize,
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

export async function OPTIONS(_req: NextRequest) {
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
