/**
 * Copilot Feedback Endpoint — M1.9
 *
 * POST /api/v1/copilot/feedback
 * Submit user feedback for a Copilot query response
 *
 * Body:
 * - projectSlug: string
 * - queryId: string (ID of the CopilotQueryLog)
 * - rating: number (1-5 or -1/1)
 * - comment?: string
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security-headers'
import { prisma } from '@calibr/db'
import { requireProjectAccess, errorJson } from '../../price-changes/utils'
import { z } from 'zod'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const feedbackSchema = z.object({
    projectSlug: z.string(),
    queryId: z.string(),
    rating: z.union([z.literal(-1), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    comment: z.string().optional(),
})

export const POST = withSecurity(
    withRateLimit(
        rateLimiters.copilot,
        async function POST(req: NextRequest) {
            try {
                const body = await req.json()
                const parsed = feedbackSchema.safeParse(body)

                if (!parsed.success) {
                    return NextResponse.json(parsed.error.flatten(), { status: 400 })
                }

                const { projectSlug, queryId, rating, comment } = parsed.data

                // RBAC: Check project access
                const access = await requireProjectAccess(req, projectSlug, 'VIEWER')
                if ('error' in access) {
                    return errorJson(access.error)
                }

                const { project } = access

                // Verify the log entry exists and belongs to this project
                const logEntry = await prisma().copilotQueryLog.findUnique({
                    where: { id: queryId },
                    select: { projectId: true },
                })

                if (!logEntry) {
                    return NextResponse.json(
                        { error: 'Query log not found' },
                        { status: 404 }
                    )
                }

                if (logEntry.projectId !== project.id) {
                    return NextResponse.json(
                        { error: 'Query log does not belong to this project' },
                        { status: 403 }
                    )
                }

                // Update feedback
                const updated = await prisma().copilotQueryLog.update({
                    where: { id: queryId },
                    data: {
                        feedbackRating: rating,
                        feedbackComment: comment,
                        feedbackAt: new Date(),
                    },
                })

                return NextResponse.json(
                    {
                        success: true,
                        feedback: {
                            rating: updated.feedbackRating,
                            comment: updated.feedbackComment,
                            at: updated.feedbackAt
                        }
                    },
                    { status: 200 }
                )
            } catch (error) {
                console.error('[Copilot Feedback] Error:', error)
                return NextResponse.json(
                    {
                        error: 'Failed to submit feedback',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                    { status: 500 }
                )
            }
        }
    )
)

export const OPTIONS = withSecurity(async () => {
    return new NextResponse(null, { status: 204 })
})
