/**
 * POST /api/v1/rules/:ruleId/materialize
 * M1.6: Materialize a pricing rule run (create targets without applying)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRulesWorker } from '@calibr/automation-runner'
import { logger } from '@calibr/monitor'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { requireProjectAccess, errorJson } from '../../../price-changes/utils'

export const POST = withSecurity(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id
    const url = new URL(request.url)
    const projectSlug = url.searchParams.get('project')?.trim()
    if (!projectSlug) {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'The `project` query parameter is required.',
      })
    }

    const access = await requireProjectAccess(request, projectSlug, 'EDITOR')
    if ('error' in access) {
      return errorJson(access.error)
    }

    const rule = await prisma().pricingRule.findFirst({
      where: {
        id: ruleId,
        projectId: access.project.id,
        tenantId: access.project.tenantId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!rule) {
      return errorJson({
        status: 404,
        error: 'NotFound',
        message: 'Pricing rule not found',
      })
    }

    const actor = access.session.userId || 'api'

    logger.info(`[API] Materializing rule run for rule: ${ruleId}`, {
      actor
    } as any)

    // Get worker instance
    const worker = getRulesWorker()

    // Materialize the run
    const run = await worker.materialize(ruleId, actor)

    // Get target count
    const targetCount = await worker.getRunStatus(run.id)

    // Estimate duration (roughly 1 second per target with concurrency)
    const estimatedDuration = targetCount
      ? Math.ceil((targetCount.totalTargets * 1000) / 5)
      : 0

    logger.info(`[API] Materialized rule run: ${run.id}`, {
      ruleId,
      runId: run.id,
      targetCount: targetCount?.totalTargets
    } as any)

    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        ruleId,
        status: run.status,
        targetCount: targetCount?.totalTargets || 0,
        estimatedDuration,
        createdAt: run.createdAt
      }
    })
  } catch (error) {
    logger.error('[API] Error materializing rule run', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ruleId: params.id
    } as any)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to materialize rule run'
      },
      { status: 500 }
    )
  }
})

export const OPTIONS = withSecurity(async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
})
