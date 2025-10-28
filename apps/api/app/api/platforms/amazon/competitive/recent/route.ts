import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export const runtime = 'nodejs'

// GET /api/platforms/amazon/competitive/recent?limit=50
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '20'), 1), 200)
    const page = Math.max(Number(searchParams.get('page') || '1'), 1)
    const q = searchParams.get('q') || undefined
    const marketplaceId = searchParams.get('marketplaceId') || undefined

    // Fetch last N rows, then de-duplicate by ASIN in code (latest wins)
    const where: any = {}
    if (q) where.asin = { contains: q, mode: 'insensitive' }
    if (marketplaceId) where.marketplaceId = marketplaceId
    const rows = await prisma().amazonCompetitivePrice.findMany({
      where,
      orderBy: { retrievedAt: 'desc' },
      take: Math.max(limit * 4, limit), // oversample to increase uniqueness chances
    })

    const seen = new Set<string>()
    const uniquesAll: any[] = []
    for (const row of rows) {
      if (!seen.has(row.asin)) {
        seen.add(row.asin)
        uniquesAll.push(row)
      }
    }

    const start = (page - 1) * limit
    const items = uniquesAll.slice(start, start + limit)
    const hasMore = uniquesAll.length > start + items.length

    return NextResponse.json({ items, page, limit, hasMore })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load recent ASINs', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

