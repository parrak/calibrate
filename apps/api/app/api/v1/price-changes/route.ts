import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { trackPerformance } from '@/lib/performance-middleware'
import { withSecurity } from '@/lib/security-headers'
import {
  errorJson,
  requireProjectAccess,
  toPriceChangeDTO,
  type PriceChangeStatus,
} from './utils'

const PAGE_SIZE = 50
const STATUS_SET = new Set<PriceChangeStatus>([
  'PENDING',
  'APPROVED',
  'APPLIED',
  'REJECTED',
  'FAILED',
  'ROLLED_BACK',
])

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

  const statusParam = url.searchParams.get('status')?.trim()?.toUpperCase()
  const q = url.searchParams.get('q')?.trim()
  const cursor = url.searchParams.get('cursor')?.trim()

  let statusFilter: PriceChangeStatus | null = 'PENDING'
  if (statusParam) {
    if (statusParam === 'ALL') {
      statusFilter = null
    } else if (STATUS_SET.has(statusParam as PriceChangeStatus)) {
      statusFilter = statusParam as PriceChangeStatus
    } else {
      return errorJson({
        status: 400,
        error: 'InvalidStatus',
        message: `Unsupported status "${statusParam}".`,
      })
    }
  }

  const access = await requireProjectAccess(req, projectSlug, 'VIEWER')
  if ('error' in access) {
    return errorJson(access.error)
  }

  const where: any = { projectId: access.project.id }
  if (statusFilter) {
    where.status = statusFilter
  }

  if (q) {
    where.OR = [
      { source: { contains: q, mode: 'insensitive' } },
      {
        context: {
          path: ['skuCode'],
          string_contains: q,
          mode: 'insensitive',
        },
      },
    ]
  }

  const query: any = {
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
    records = await prisma().priceChange.findMany(query)
  } catch (err: any) {
    return errorJson({
      status: 400,
      error: 'InvalidCursor',
      message: err?.message ?? 'Invalid cursor supplied.',
    })
  }

  const items = records.slice(0, PAGE_SIZE).map(toPriceChangeDTO)
  const nextCursor = records.length > PAGE_SIZE ? records[PAGE_SIZE].id : undefined

  return NextResponse.json({
    items,
    nextCursor,
    role: access.membership.role,
  })
}))

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
