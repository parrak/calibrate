import { NextResponse } from 'next/server'
import { getDLQService } from '@calibr/automation-runner'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const RetrySchema = z.object({
  targetIds: z.array(z.string()).optional()
})

export async function POST(
  req: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const body = await req.json().catch(() => ({}))
    const { targetIds } = RetrySchema.parse(body)
    const { runId } = params

    const service = getDLQService()
    const retriedTargets = await service.retryFailed(runId, targetIds)

    return NextResponse.json({
      runId,
      status: 'queued',
      retriedCount: retriedTargets.length,
      targets: retriedTargets.map((t: any) => ({
        id: t.id,
        skuId: t.skuId,
        status: t.status
      }))
    })
  } catch (error) {
    console.error('Failed to retry failed targets:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
