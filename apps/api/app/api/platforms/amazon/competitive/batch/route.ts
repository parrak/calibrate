import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { getCompetitivePrice } from '@calibr/amazon-connector'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'

export const runtime = 'nodejs'

// POST /api/platforms/amazon/competitive/batch  { asins: string[] }
export const POST = withSecurity(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const asins: string[] = Array.isArray(body?.asins) ? body.asins : []
    if (!asins.length) return NextResponse.json({ error: 'asins array required' }, { status: 400 })

    const results: Array<{ asin: string; ok: boolean; id?: string; error?: string }> = []

    for (const asin of asins) {
      try {
        const snapshot = await getCompetitivePrice(asin)
        const saved = await prisma().amazonCompetitivePrice.create({
          data: {
            id: createId(),
            asin: snapshot.asin,
            marketplaceId: snapshot.marketplaceId,
            lowestPriceCents: snapshot.lowestPrice != null ? Math.round(Number(snapshot.lowestPrice) * 100) : null,
            buyBoxPriceCents: snapshot.buyBoxPrice != null ? Math.round(Number(snapshot.buyBoxPrice) * 100) : null,
            offerCount: snapshot.offerCount || 0,
            data: snapshot as any,
          },
        })
        results.push({ asin, ok: true, id: saved.id })
      } catch (err: any) {
        results.push({ asin, ok: false, error: err?.message || 'unknown error' })
      }
    }

    const successful = results.filter(r => r.ok).length
    return NextResponse.json({ ok: successful === results.length, successful, total: results.length, results })
  } catch (error) {
    return NextResponse.json({ error: 'Batch track failed', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (req: NextRequest) => new NextResponse(null, { status: 204 }))
