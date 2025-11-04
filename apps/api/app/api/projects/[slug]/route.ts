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

    // Get integrations (Shopify and Amazon separately since there's no unified PlatformIntegration model)
    const [shopifyIntegrations, amazonIntegrations] = await Promise.all([
      db.shopifyIntegration.findMany({
        where: { projectId: project.id },
        select: {
          id: true,
          shopDomain: true,
          isActive: true,
          lastSyncAt: true,
        },
      }),
      db.amazonIntegration.findMany({
        where: { projectId: project.id },
        select: {
          id: true,
          sellerId: true,
          isActive: true,
        },
      }),
    ])

    // Combine integrations with platform identifiers
    const integrations = [
      ...shopifyIntegrations.map((i) => ({
        id: i.id,
        platform: 'shopify' as const,
        status: i.isActive ? 'active' : 'inactive',
        lastSyncAt: i.lastSyncAt,
      })),
      ...amazonIntegrations.map((i) => ({
        id: i.id,
        platform: 'amazon' as const,
        status: i.isActive ? 'active' : 'inactive',
        lastSyncAt: null,
      })),
    ]

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
  } catch (error: unknown) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
