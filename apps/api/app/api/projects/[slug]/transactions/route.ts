import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await context.params
        const userId = req.nextUrl.searchParams.get('userId')
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
        const cursor = req.nextUrl.searchParams.get('cursor')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 401 }
            )
        }

        const db = prisma()

        // Find project
        const project = await db.project.findUnique({
            where: { slug },
        })

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Check user has access
        const membership = await db.membership.findUnique({
            where: {
                userId_projectId: {
                    userId,
                    projectId: project.id,
                },
            },
        })

        if (!membership) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Fetch transactions
        const transactions = await db.transaction.findMany({
            where: {
                projectId: project.id,
            },
            take: limit + 1, // Fetch one extra to determine if there's a next page
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
                occurredAt: 'desc',
            },
            include: {
                Product: {
                    select: {
                        name: true,
                        code: true,
                    }
                }
            }
        })

        let nextCursor: string | undefined = undefined
        if (transactions.length > limit) {
            const nextItem = transactions.pop()
            nextCursor = nextItem?.id
        }

        return NextResponse.json({
            data: transactions,
            nextCursor,
        })
    } catch (error: unknown) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions', message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
