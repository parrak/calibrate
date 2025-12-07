import { NextResponse } from 'next/server'
import { getRulesWorker } from '@calibr/automation-runner'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params
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
}
