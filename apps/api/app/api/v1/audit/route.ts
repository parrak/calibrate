import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { trackPerformance } from '@/lib/performance-middleware'
import { withSecurity } from '@/lib/security-headers'

const PAGE_SIZE = 50

interface ErrorResponse {
  status: number
  error: string
  message: string
}

function errorJson(error: ErrorResponse) {
  return NextResponse.json(
    { error: error.error, message: error.message },
    { status: error.status }
  )
}

async function requireProjectAccess(req: NextRequest, projectSlug: string, requiredRole: 'VIEWER' | 'EDITOR' | 'ADMIN'): Promise<
  | { error: ErrorResponse }
  | { project: any; membership: { role: 'ADMIN' } }
> {
  // TODO: Implement proper auth - for now, we'll use a simplified version
  // This should be extracted to a shared auth utility
  const project = await prisma().project.findUnique({
    where: { slug: projectSlug },
    include: {
      Tenant: true,
    },
  })

  if (!project) {
    return {
      error: {
        status: 404,
        error: 'NotFound',
        message: `Project "${projectSlug}" not found.`,
      },
    }
  }

  // For now, return a mock membership
  // In production, you would verify the user's access to this project
  return {
    project,
    membership: { role: 'ADMIN' as const },
  }
}

export const GET = withSecurity(trackPerformance(async (req: NextRequest) => {
  const url = new URL(req.url)
  const projectSlug = url.searchParams.get('project')?.trim()

  if (!projectSlug) {
    return errorJson({
      status: 400,
      error: 'BadRequest',
      message: 'The `project` query parameter is required.',
    })
  }

  const access = await requireProjectAccess(req, projectSlug, 'VIEWER')
  if ('error' in access) {
    return errorJson(access.error)
  }

  // Query parameters for filtering
  const entity = url.searchParams.get('entity')?.trim()
  const entityId = url.searchParams.get('entityId')?.trim()
  const action = url.searchParams.get('action')?.trim()
  const actor = url.searchParams.get('actor')?.trim()
  const cursor = url.searchParams.get('cursor')?.trim()
  const startDate = url.searchParams.get('startDate')?.trim()
  const endDate = url.searchParams.get('endDate')?.trim()

  // Build where clause
  const where: {
    tenantId: string
    projectId?: string
    entity?: string
    entityId?: string
    action?: string
    actor?: string
    createdAt?: {
      gte?: Date
      lte?: Date
    }
  } = {
    tenantId: access.project.tenantId,
  }

  // Only filter by projectId if it's provided in the project
  if (access.project.id) {
    where.projectId = access.project.id
  }

  if (entity) {
    where.entity = entity
  }

  if (entityId) {
    where.entityId = entityId
  }

  if (action) {
    where.action = action
  }

  if (actor) {
    where.actor = actor
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate)
    }
  }

  const query: {
    where: typeof where
    orderBy: { createdAt: 'desc' }
    take: number
    cursor?: { id: string }
    skip?: number
  } = {
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
  }

  if (cursor) {
    query.cursor = { id: cursor }
    query.skip = 1
  }

  let records
  try {
    records = await prisma().audit.findMany(query)
  } catch (err: unknown) {
    return errorJson({
      status: 400,
      error: 'InvalidQuery',
      message: err instanceof Error ? err.message : 'Invalid query parameters.',
    })
  }

  const items = records.slice(0, PAGE_SIZE)
  const nextCursor = records.length > PAGE_SIZE ? records[PAGE_SIZE].id : undefined

  return NextResponse.json({
    items,
    nextCursor,
    role: access.membership.role,
  })
}))

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
