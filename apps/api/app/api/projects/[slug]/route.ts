import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

/**
 * Get Single Project by Slug
 * Verifies user has access to the project
 */

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    const db = prisma()

    // Find project
    const project = await db.project.findUnique({
      where: { slug },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user has access
    const membership = await db.membership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: project.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get integrations
    const integrations = await db.platformIntegration.findMany({
      where: { projectId: project.id },
      select: {
        id: true,
        platform: true,
        status: true,
        lastSyncAt: true,
      },
    })

    // Get counts
    const productsCount = await db.product.count({
      where: { projectId: project.id },
    })

    const policiesCount = await db.policy.count({
      where: { projectId: project.id },
    })

    return NextResponse.json({
      id: project.id,
      slug: project.slug,
      name: project.name,
      tenantId: project.tenantId,
      role: membership.role,
      integrations,
      stats: {
        products: productsCount,
        policies: policiesCount,
        integrations: integrations.length,
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project', message: error?.message || String(error) },
      { status: 500 }
    )
  }
}
