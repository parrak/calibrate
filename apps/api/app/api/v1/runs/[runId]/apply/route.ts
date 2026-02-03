import { NextRequest, NextResponse } from 'next/server'
import { getRulesWorker } from '@calibr/automation-runner'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { requireProjectAccess, errorJson } from '../../../price-changes/utils'

export const dynamic = 'force-dynamic'

export const POST = withSecurity(async function POST(
  req: NextRequest,
  ctx?: { params: { runId: string } }
) {
  try {
    const runId = ctx?.params?.runId
    if (!runId) {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'Run id is required.',
      })
    }
    const url = new URL(req.url)
    const projectSlug = url.searchParams.get('project')?.trim()
    if (!projectSlug) {
      return errorJson({
        status: 400,
        error: 'BadRequest',
        message: 'The `project` query parameter is required.',
      })
    }

    const access = await requireProjectAccess(req, projectSlug, 'ADMIN')
    if ('error' in access) {
      return errorJson(access.error)
    }

    const run = await prisma().ruleRun.findFirst({
      where: {
        id: runId,
        projectId: access.project.id,
        tenantId: access.project.tenantId,
      },
      select: {
        id: true,
        status: true,
        RuleTarget: { select: { id: true }, take: 1 },
      },
    })

    if (!run) {
      return errorJson({
        status: 404,
        error: 'NotFound',
        message: 'Run not found',
      })
    }

    if (run.status !== 'PREVIEW') {
      return errorJson({
        status: 409,
        error: 'Conflict',
        message: 'Only preview runs can be queued for application.',
      })
    }

    if (!run.RuleTarget.length) {
      return errorJson({
        status: 400,
        error: 'NoTargets',
        message: 'Run has no targets to apply.',
      })
    }

    const worker = getRulesWorker()

    await worker.queueRun(runId)
    const status = await worker.getRunStatus(runId)

    return NextResponse.json({
      runId,
      status: status?.status || 'QUEUED',
      message: 'Rule run queued for application',
      details: status
    })
  } catch (error) {
    console.error('Failed to queue rule run:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

export const OPTIONS = withSecurity(async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
})
