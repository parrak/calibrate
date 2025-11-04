import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

// GET /api/platforms/amazon/watchlist?q=&limit=&page=
export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '50'), 1), 200)
    const page = Math.max(Number(searchParams.get('page') || '1'), 1)

    const where: { active: boolean; asin?: { contains: string; mode?: 'insensitive' | 'default' } } = { active: true }
    if (q) where.asin = { contains: q, mode: 'insensitive' as const }

    const [total, items] = await Promise.all([
      prisma().amazonWatchlist.count({ where }),
      prisma().amazonWatchlist.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit })
    ])

    return NextResponse.json({ items, page, limit, total })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load watchlist', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

// POST /api/platforms/amazon/watchlist { asin, marketplaceId }
export const POST = withSecurity(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const asin = body?.asin as string | undefined
    const marketplaceId = (body?.marketplaceId as string | undefined) || 'ATVPDKIKX0DER'
    if (!asin) return NextResponse.json({ error: 'asin required' }, { status: 400 })

    const saved = await prisma().amazonWatchlist.upsert({
      where: { asin_marketplaceId: { asin, marketplaceId } },
      create: { asin, marketplaceId, active: true },
      update: { active: true },
    })
    return NextResponse.json({ ok: true, item: saved })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update watchlist', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

// DELETE /api/platforms/amazon/watchlist?asin=&marketplaceId=
export const DELETE = withSecurity(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const asin = searchParams.get('asin')
    const marketplaceId = searchParams.get('marketplaceId') || 'ATVPDKIKX0DER'
    if (!asin) return NextResponse.json({ error: 'asin required' }, { status: 400 })

    await prisma().amazonWatchlist.delete({ where: { asin_marketplaceId: { asin, marketplaceId } } }).catch(async () => {
      // If row does not exist, ensure idempotency by upserting inactive
      await prisma().amazonWatchlist.upsert({
        where: { asin_marketplaceId: { asin, marketplaceId } },
        create: { asin, marketplaceId, active: false },
        update: { active: false },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove from watchlist', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (_req: NextRequest) => new NextResponse(null, { status: 204 }))

