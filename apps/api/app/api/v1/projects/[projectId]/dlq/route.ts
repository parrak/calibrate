/**
 * GET /api/v1/projects/:projectId/dlq
 * Get DLQ report for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { DLQService } from '@calibr/automation-runner'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Generate DLQ report
    const dlqService = new DLQService()
    const report = await dlqService.generateDLQReport(projectId)

    return NextResponse.json({
      projectId,
      totalFailed: report.totalFailed,
      byErrorType: report.byErrorType,
      recommendations: report.recommendations,
      entries: report.entries.map(entry => ({
        targetId: entry.target.id,
        runId: entry.run.id,
        skuId: entry.target.skuId,
        productId: entry.target.productId,
        variantId: entry.target.variantId,
        errorType: entry.errorType,
        errorMessage: entry.target.errorMessage,
        failedAt: entry.failedAt,
        retryable: entry.retryable,
        attempts: entry.target.attempts,
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
