import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const pc = await prisma().priceChange.update({
    where: { id },
    data: { status: 'APPROVED' }
  })

  const response = NextResponse.json({ id: pc.id, status: pc.status })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Calibr-Project')
  return response
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Calibr-Project')
  return response
}
