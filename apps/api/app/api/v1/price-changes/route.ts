import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') ?? undefined
  const where = status ? { status: status as any } : {}
  
  const items = await prisma.priceChange.findMany({ 
    where, 
    orderBy: { createdAt: 'desc' }, 
    take: 50 
  })
  
  return NextResponse.json({ items })
}
