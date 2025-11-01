/**
 * Shopify Sync Status Route
 * Handles sync status queries
 */
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';
import { prisma } from '@calibr/db';

export const runtime = 'nodejs';

/**
 * GET /api/platforms/shopify/sync/status
 * 
 * Get sync status and history
 */
export const GET = withSecurity(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let projectId = searchParams.get('projectId');
    const projectSlug = searchParams.get('projectSlug');

    // If projectSlug is provided, resolve it to projectId
    if (projectSlug && !projectId) {
      const project = await prisma().project.findUnique({
        where: { slug: projectSlug },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      projectId = project.id;
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId or projectSlug parameter' },
        { status: 400 }
      );
    }

    // Find the Shopify integration
    const integration = await prisma().shopifyIntegration.findFirst({
      where: {
        projectId,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No active Shopify integration found' },
        { status: 404 }
      );
    }

    // Get recent sync logs - PlatformSyncLog model doesn't exist yet, so return empty array
    // TODO: Create PlatformSyncLog model or use alternative storage
    const syncLogs: any[] = [];
    
    // Try to query sync logs if model exists, catch error gracefully
    try {
      // This will fail if model doesn't exist, but we'll catch it
      const logs = await (prisma() as any).platformSyncLog?.findMany({
        where: { integrationId: integration.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }) || [];
      syncLogs.push(...logs);
    } catch (err) {
      // Model doesn't exist yet - this is expected
      console.log('PlatformSyncLog model not available, returning empty logs');
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        platformName: integration.shopDomain,
        status: integration.isActive ? 'CONNECTED' : 'DISCONNECTED',
        syncStatus: integration.syncStatus,
        lastSyncAt: integration.lastSyncAt?.toISOString() || null,
        syncError: integration.syncError,
      },
      syncLogs: syncLogs.map(log => ({
        id: log.id,
        syncType: log.syncType,
        status: log.status,
        startedAt: log.startedAt?.toISOString() || new Date().toISOString(),
        completedAt: log.completedAt?.toISOString() || null,
        itemsProcessed: log.itemsProcessed || 0,
        itemsSuccessful: log.itemsSuccessful || 0,
        itemsFailed: log.itemsFailed || 0,
        errors: log.errors || null,
      })),
    });
  } catch (error) {
    console.error('Shopify sync status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204 });
});

