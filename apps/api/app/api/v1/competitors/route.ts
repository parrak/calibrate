import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { verifyHmac } from '@calibr/security'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'

const db = () => prisma()

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const projectId = searchParams.get('projectId')

    if (!tenantId || !projectId) {
      return NextResponse.json({ error: 'Missing tenantId or projectId' }, { status: 400 })
    }

    const competitors = await db().competitor.findMany({
      where: {
        tenantId,
        projectId
      },
      include: {
        CompetitorProduct: {
          include: {
            CompetitorPrice: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ competitors })
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
});

export const POST = withSecurity(async (request: NextRequest) => {
  try {
    // Verify HMAC signature
    const authResult = await verifyHmac(request)
    if (!authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, projectId, name, domain, channel } = body

    if (!tenantId || !projectId || !name || !domain || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const competitor = await db().competitor.create({
      data: {
        id: createId(),
        tenantId,
        projectId,
        name,
        domain,
        channel,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ competitor }, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async (_req: NextRequest) => {
  return new NextResponse(null, { status: 204 });
});
