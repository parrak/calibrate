import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const pc = await prisma.priceChange.update({ 
    where: { id: params.id }, 
    data: { status: 'REJECTED' } 
  })
  
  return NextResponse.json({ id: pc.id, status: pc.status })
}
