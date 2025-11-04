import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { getCompetitivePrice } from '@calibr/amazon-connector'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withSecurity(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get('x-cron-auth')
    const expected = process.env.CRON_TOKEN || process.env.CRON_SECRET
    if (!expected || authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const watch = await prisma().amazonWatchlist.findMany({ where: { active: true } })
    let ok = 0
    let failed = 0
    for (const w of watch) {
      try {
        const snap = await getCompetitivePrice(w.asin)
        await prisma().amazonCompetitivePrice.create({
          data: {
            id: createId(),
            asin: snap.asin,
            marketplaceId: snap.marketplaceId,
            lowestPriceCents: snap.lowestPrice != null ? Math.round(Number(snap.lowestPrice) * 100) : null,
            buyBoxPriceCents: snap.buyBoxPrice != null ? Math.round(Number(snap.buyBoxPrice) * 100) : null,
            offerCount: snap.offerCount || 0,
            data: snap as Record<string, unknown>,
          },
        })
        ok++
      } catch {
        failed++
      }
    }
    return NextResponse.json({ ok: failed === 0, processed: watch.length, successful: ok, failed })
  } catch (error) {
    return NextResponse.json({ error: 'Cron watchlist failed', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (_req: NextRequest) => new NextResponse(null, { status: 204 }))

