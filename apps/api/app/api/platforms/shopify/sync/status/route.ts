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

    // Get recent sync logs - Try PlatformSyncLog model first, fallback to integration record
    const syncLogs: Array<{
      id: string
      syncType?: string
      status: string
      startedAt: Date | null
      completedAt: Date | null
      itemsProcessed: number
      itemsSuccessful: number
      itemsFailed: number
      errors: string[] | null
    }> = [];

    // Try to query sync logs if model exists
    try {
      const prismaClient = prisma() as Record<string, unknown>
      const platformSyncLog = prismaClient.platformSyncLog as { findMany?: (args: { where: { integrationId: string }; orderBy: { startedAt: string }; take: number }) => Promise<unknown[]> } | undefined
      const logs = await platformSyncLog?.findMany?.({
        where: { integrationId: integration.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }) || [];
      if (Array.isArray(logs)) {
        syncLogs.push(...(logs as typeof syncLogs));
      }
    } catch (_err) {
      // Model doesn't exist yet - create sync log from integration record
      if (integration.lastSyncAt) {
        // Parse summary from syncError if it contains summary info
        // Format: "SUMMARY: total=X, successful=Y, failed=Z" or "X items failed to sync (Y successful, Z total). SUMMARY: ..."
        let itemsProcessed = 0;
        let itemsSuccessful = 0;
        let itemsFailed = 0;

        if (integration.syncError) {
          // Try to extract from SUMMARY format first
          const summaryMatch = integration.syncError.match(/SUMMARY:\s*total=(\d+),\s*successful=(\d+),\s*failed=(\d+)/);
          if (summaryMatch) {
            itemsProcessed = parseInt(summaryMatch[1], 10);
            itemsSuccessful = parseInt(summaryMatch[2], 10);
            itemsFailed = parseInt(summaryMatch[3], 10);
          } else {
            // Fallback: try to extract from error message format
            const errorMatch = integration.syncError.match(/(\d+)\s+items?\s+failed.*?(\d+)\s+successful.*?(\d+)\s+total/);
            if (errorMatch) {
              itemsFailed = parseInt(errorMatch[1], 10);
              itemsSuccessful = parseInt(errorMatch[2], 10);
              itemsProcessed = parseInt(errorMatch[3], 10);
            } else {
              // If no summary, assume at least 1 failed item if error exists
              itemsFailed = 1;
              itemsProcessed = 1;
            }
          }
        } else if (integration.syncStatus === 'SUCCESS') {
          // For successful syncs without error details, we can't know the count
          // But we'll show it as successful
          itemsSuccessful = 1; // At least 1 item was synced
          itemsProcessed = 1;
        }

        // Determine status
        const status = integration.syncStatus?.toUpperCase() || 'SUCCESS';
        const finalStatus = status === 'SUCCESS' ? 'SUCCESS'
          : status === 'ERROR' ? 'ERROR'
          : status === 'PARTIAL' ? 'PARTIAL'
          : 'SUCCESS';

        syncLogs.push({
          id: `integration-${integration.id}`,
          syncType: 'full', // Default to full sync
          status: finalStatus,
          startedAt: integration.lastSyncAt,
          completedAt: integration.lastSyncAt,
          itemsProcessed,
          itemsSuccessful,
          itemsFailed,
          errors: integration.syncError ? [integration.syncError] : null,
        });
      }
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
        syncType: log.syncType || 'full',
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
export const OPTIONS = withSecurity(async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { status: 204 });
});

