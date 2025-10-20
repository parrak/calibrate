import { NextResponse } from 'next/server'
import { applyPriceChange } from '@calibr/pricing-engine'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const res = await applyPriceChange(params.id)
  return NextResponse.json({ priceId: res.id, amount: res.amount })
}
