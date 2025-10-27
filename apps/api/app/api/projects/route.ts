import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'
import { withSecurity } from '@/lib/security-headers'

/**
 * Projects API
 * Handles project creation and listing for user onboarding
 */

export const POST = withSecurity(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, slug, userId, tenantId } = body

    // Validation
    if (!name || typeof name !== 'string' || name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: 'Project name is required (3-50 characters)' },
        { status: 400 }
      )
    }

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Project slug is required (lowercase alphanumeric + hyphens only)' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    const db = prisma()

    // Check if slug is already taken
    const existingProject = await db.project.findUnique({
      where: { slug },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'This slug is already taken. Try a different one.' },
        { status: 409 }
      )
    }

    // Get or verify user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use provided tenantId or user's existing tenantId
    const finalTenantId = tenantId || user.tenantId

    // Create project
    const project = await db.project.create({
      data: {
        name,
        slug,
        tenantId: finalTenantId,
      },
    })

    // Create owner membership
    await db.membership.create({
      data: {
        userId: user.id,
        projectId: project.id,
        role: 'OWNER',
      },
    })

    return NextResponse.json({
      id: project.id,
      slug: project.slug,
      name: project.name,
      tenantId: project.tenantId,
      createdAt: project.createdAt,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project', message: error?.message || String(error) },
      { status: 500 }
    )
  }
})

export const GET = withSecurity(async (req: NextRequest) => {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    const db = prisma()

    // Get user's projects through memberships
    const memberships = await db.membership.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            platformIntegrations: {
              select: {
                id: true,
                platform: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        project: {
          createdAt: 'desc',
        },
      },
    })

    const projects = memberships.map((m) => ({
      id: m.project.id,
      slug: m.project.slug,
      name: m.project.name,
      role: m.role,
      integrationCount: m.project.platformIntegrations.length,
      integrations: m.project.platformIntegrations,
      createdAt: m.project.createdAt,
      updatedAt: m.project.updatedAt,
    }))

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: error?.message || String(error) },
      { status: 500 }
    )
  }
})

// Handle OPTIONS preflight requests
export const OPTIONS = withSecurity(async (req: NextRequest) => {
  return new NextResponse(null, { status: 204 })
})
