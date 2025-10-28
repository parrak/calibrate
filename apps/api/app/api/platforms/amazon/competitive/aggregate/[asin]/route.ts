import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/platforms/amazon/competitive/aggregate/:asin?days=7&marketplaceId=ATVPDKIKX0DER
export async function GET(req: NextRequest, { params }: { params: { asin: string } }) {
  try {
    const { asin } = params
    const { searchParams } = new URL(req.url)
    const days = Math.max(1, Math.min(90, Number(searchParams.get('days') || '7')))
    const marketplaceId = searchParams.get('marketplaceId') || undefined

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const where: any = { asin, retrievedAt: { gte: since } }
    if (marketplaceId) where.marketplaceId = marketplaceId

    const rows = await prisma().amazonCompetitivePrice.findMany({
      where,
      orderBy: { retrievedAt: 'desc' },
      take: 5000,
    })

    // Group by yyyy-mm-dd
    const bucket: Record<string, { count: number; lowest: number; buybox: number; offers: number }> = {}
    for (const r of rows) {
      const d = new Date(r.retrievedAt)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
      if (!bucket[key]) bucket[key] = { count: 0, lowest: 0, buybox: 0, offers: 0 }
      bucket[key].count += 1
      if (typeof r.lowestPriceCents === 'number') bucket[key].lowest += r.lowestPriceCents
      if (typeof r.buyBoxPriceCents === 'number') bucket[key].buybox += r.buyBoxPriceCents
      bucket[key].offers += r.offerCount || 0
    }

    const series = Object.entries(bucket)
      .map(([date, v]) => ({
        date,
        lowestAvgCents: v.count ? Math.round(v.lowest / v.count) : null,
        buyBoxAvgCents: v.count ? Math.round(v.buybox / v.count) : null,
        offerAvg: v.count ? Math.round(v.offers / v.count) : 0,
      }))
      .sort((a,b) => a.date.localeCompare(b.date))

    return NextResponse.json({ asin, marketplaceId: marketplaceId || null, days, series })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute aggregates', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

