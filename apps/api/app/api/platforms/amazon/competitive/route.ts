import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@calibr/db'
import { getCompetitivePrice } from '@calibr/amazon-connector'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'

export const runtime = 'nodejs'

// GET /api/platforms/amazon/competitive?asin=...&limit=50
export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const asin = searchParams.get('asin')
    const marketplaceId = searchParams.get('marketplaceId') || undefined
    const limit = Number(searchParams.get('limit') || '50')
    if (!asin) return NextResponse.json({ error: 'asin required' }, { status: 400 })

    const rows = await prisma().amazonCompetitivePrice.findMany({
      where: { asin, ...(marketplaceId ? { marketplaceId } : {}) },
      orderBy: { retrievedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    })

    return NextResponse.json({ items: rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load history', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

// POST /api/platforms/amazon/competitive  { asin: string }
export const POST = withSecurity(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const asin = body?.asin as string | undefined
    if (!asin) return NextResponse.json({ error: 'asin required' }, { status: 400 })

    const snapshot = await getCompetitivePrice(asin)

    const saved = await prisma().amazonCompetitivePrice.create({
      data: {
        id: createId(),
        asin: snapshot.asin,
        marketplaceId: snapshot.marketplaceId,
        lowestPriceCents: snapshot.lowestPrice != null ? Math.round(Number(snapshot.lowestPrice) * 100) : null,
        buyBoxPriceCents: snapshot.buyBoxPrice != null ? Math.round(Number(snapshot.buyBoxPrice) * 100) : null,
        offerCount: snapshot.offerCount || 0,
        data: snapshot as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ ok: true, id: saved.id, retrievedAt: saved.retrievedAt })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track competitive price', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (_req: NextRequest) => new NextResponse(null, { status: 204 }))
