import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'

const db = () => prisma()

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')

    if (!projectSlug) {
      return NextResponse.json({ error: 'Missing projectSlug parameter' }, { status: 400 })
    }

    // Resolve projectSlug to project
    const project = await db().project.findUnique({
      where: { slug: projectSlug }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const competitors = await db().competitor.findMany({
      where: {
        tenantId: project.tenantId,
        projectId: project.id
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
    const body = await request.json()
    const { projectSlug, name, domain, channel } = body

    if (!projectSlug || !name || !domain || !channel) {
      return NextResponse.json({ error: 'Missing required fields: projectSlug, name, domain, channel' }, { status: 400 })
    }

    // Resolve projectSlug to project
    const project = await db().project.findUnique({
      where: { slug: projectSlug }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const competitor = await db().competitor.create({
      data: {
        id: createId(),
        tenantId: project.tenantId,
        projectId: project.id,
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
