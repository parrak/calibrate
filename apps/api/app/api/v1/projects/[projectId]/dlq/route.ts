/**
 * GET /api/v1/projects/:projectId/dlq
 * Get DLQ report for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

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

    // Get all failed targets for the project
    const failedTargets = await prisma().ruleTarget.findMany({
      where: {
        projectId,
        status: 'FAILED',
      },
      include: {
        RuleRun: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({
      projectId,
      totalFailed: failedTargets.length,
      entries: failedTargets.map((entry: any) => ({
        targetId: entry.id,
        runId: entry.ruleRunId,
        skuId: entry.skuId,
        productId: entry.productId,
        variantId: entry.variantId,
        errorMessage: entry.errorMessage,
        failedAt: entry.updatedAt,
        attempts: entry.attempts,
      })),
    })
  } catch (error) {
    console.error('Error generating DLQ report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate DLQ report',
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
