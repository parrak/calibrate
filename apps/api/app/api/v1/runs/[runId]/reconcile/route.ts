import { NextResponse } from 'next/server'
import { getReconciliationService } from '@calibr/automation-runner'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params
    const service = getReconciliationService()

    const report = await service.reconcileRun(runId)

    return NextResponse.json({
      runId,
      status: 'completed',
      report
    })
  } catch (error) {
    console.error('Failed to reconcile rule run:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
