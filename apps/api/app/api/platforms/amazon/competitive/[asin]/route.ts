import { NextRequest, NextResponse } from 'next/server'
import { getCompetitivePrice } from '@calibr/amazon-connector'
import { withSecurity } from '@/lib/security-headers'

export const runtime = 'nodejs'

interface Params { params: { asin: string } }

export const GET = withSecurity(async (req: NextRequest, { params }: Params) => {
  try {
    const { asin } = params
    if (!asin) return NextResponse.json({ error: 'asin required' }, { status: 400 })
    const data = await getCompetitivePrice(asin)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get competitive price', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})

export const OPTIONS = withSecurity(async (req: NextRequest) => new NextResponse(null, { status: 204 }))

