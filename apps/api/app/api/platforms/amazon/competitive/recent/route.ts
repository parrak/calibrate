import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export const runtime = 'nodejs'

// GET /api/platforms/amazon/competitive/recent?limit=50
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '50'), 1), 200)

    // Fetch last N rows, then de-duplicate by ASIN in code (latest wins)
    const rows = await prisma().amazonCompetitivePrice.findMany({
      orderBy: { retrievedAt: 'desc' },
      take: Math.max(limit * 3, limit), // oversample to increase uniqueness chances
    })

    const seen = new Set<string>()
    const unique: any[] = []
    for (const row of rows) {
      if (!seen.has(row.asin)) {
        seen.add(row.asin)
        unique.push(row)
        if (unique.length >= limit) break
      }
    }

    return NextResponse.json({ items: unique })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load recent ASINs', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

