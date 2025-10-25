import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')

    const products = await db.competitorProduct.findMany({
      where: {
        competitorId: params.id,
        ...(skuId && { skuId })
      },
      include: {
        sku: true,
        prices: {
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { skuId, name, skuCode, url, imageUrl } = body

    if (!name || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await db.competitorProduct.create({
      data: {
        competitorId: params.id,
        skuId,
        name,
        skuCode,
        url,
        imageUrl
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
