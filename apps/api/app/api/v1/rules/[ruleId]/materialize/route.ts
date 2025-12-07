import { NextResponse } from 'next/server'
import { getRulesWorker } from '@calibr/automation-runner'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const MaterializeSchema = z.object({
    actor: z.string().optional().default('api')
})

export async function POST(
    req: Request,
    { params }: { params: { ruleId: string } }
) {
    try {
        const body = await req.json().catch(() => ({}))
        const { actor } = MaterializeSchema.parse(body)
        const { ruleId } = params

        const worker = getRulesWorker()
        const run = await worker.materialize(ruleId, actor)

        // Get target count (since materialize returns the run object, we might need to fetch count or trust the worker logs)
        // The worker implementation returns the run object. 
        // Let's assume for now we just return the runId. 
        // Ideally worker.materialize should return { run, targetCount } or we fetch it.
        // Looking at worker code: it returns `run`.

        return NextResponse.json({
            runId: run.id,
            status: run.status,
            message: 'Rule run materialized successfully'
        })
    } catch (error) {
        console.error('Failed to materialize rule:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
