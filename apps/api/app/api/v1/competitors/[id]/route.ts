import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { verifyHmac } from '@calibr/security'

const db = () => prisma()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const competitor = await db().competitor.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            sku: true,
            prices: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    })

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    return NextResponse.json({ competitor })
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { name, domain, channel, isActive } = body
    const { id } = await context.params

    const competitor = await db().competitor.update({
      where: { id },
      data: {
        name,
        domain,
        channel,
        isActive
      }
    })

    return NextResponse.json({ competitor })
  } catch (error) {
    console.error('Error updating competitor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    await db().competitor.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competitor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
