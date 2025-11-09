import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'

const db = () => prisma()

export const GET = withSecurity(async function GET(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: 'Missing route context' }, { status: 500 })
    }
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')

    const products = await db().competitorProduct.findMany({
      where: {
        competitorId: id,
        ...(skuId && { skuId })
      },
      include: {
        Sku: true,
        CompetitorPrice: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching competitor products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withSecurity(async function POST(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: 'Missing route context' }, { status: 500 })
    }
    const body = await request.json()
    const { skuId, name, skuCode, url, imageUrl } = body
    const { id } = await context.params

    if (!name || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await db().competitorProduct.create({
      data: {
        id: createId(),
        competitorId: id,
        skuId,
        name,
        skuCode,
        url,
        imageUrl,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
