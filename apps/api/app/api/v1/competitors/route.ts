import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'
import { createId } from '@paralleldrive/cuid2'
import { authSecurityManager } from '@/lib/auth-security'

const db = () => prisma()

function requireAuth(request: NextRequest): { error?: NextResponse; session?: any } {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Valid authentication token required'
        },
        { status: 401 }
      )
    }
  }

  const token = authHeader.substring(7).trim()
  const session = authSecurityManager.validateSessionToken(token)
  if (!session || !session.userId) {
    return {
      error: NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Invalid session token'
        },
        { status: 401 }
      )
    }
  }

  return { session }
}

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    // Require authentication
    const authCheck = requireAuth(request)
    if (authCheck.error) {
      return authCheck.error
    }

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
    // Require authentication
    const authCheck = requireAuth(request)
    if (authCheck.error) {
      return authCheck.error
    }

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
