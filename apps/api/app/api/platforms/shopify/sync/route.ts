/**
 * Shopify Sync Route
 * Handles manual synchronization triggers
 */
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';
import { ConnectorRegistry } from '@calibr/platform-connector';
import { prisma } from '@calibr/db';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * POST /api/platforms/shopify/sync
 * 
 * Trigger manual synchronization
 */
export const POST = withSecurity(async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    let projectId = body?.projectId;
    const projectSlug = body?.projectSlug;
    const syncType = body?.syncType || 'full';

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

    // Update sync status to in progress
    await prisma().shopifyIntegration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'SYNCING',
        syncError: null,
      },
    });

    // Create sync log entry - PlatformSyncLog model doesn't exist yet
    // TODO: Create PlatformSyncLog model or use alternative storage
    let syncLog: any = null;
    try {
      syncLog = await (prisma() as any).platformSyncLog?.create({
        data: {
          integrationId: integration.id,
          syncType,
          status: 'SYNCING',
          startedAt: new Date(),
        },
      });
    } catch (err) {
      // Model doesn't exist yet - this is expected
      console.log('PlatformSyncLog model not available, sync will proceed without logging');
    }

    try {
      // Get connector configuration
      const config = {
        platform: 'shopify' as const,
        apiKey: process.env.SHOPIFY_API_KEY!,
        apiSecret: process.env.SHOPIFY_API_SECRET!,
        scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').split(','),
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
        apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
      };

      // Create connector with stored credentials
      const credentials = {
        platform: 'shopify' as const,
      shopDomain: integration.shopDomain,
      accessToken: integration.accessToken,
      scope: integration.scope,
      };

      const connector = await ConnectorRegistry.createConnector('shopify', config);
      await connector.initialize(credentials);

      let syncResults = [];
      let summary = { total: 0, successful: 0, failed: 0 };

      switch (syncType) {
        case 'products':
          // Sync products only
          const productResults = await connector.productOperations.syncAll({
            limit: 1000, // Reasonable limit for manual sync
          });
          syncResults = productResults;
          summary = {
            total: productResults.length,
            successful: productResults.filter(r => r.success).length,
            failed: productResults.filter(r => !r.success).length,
          };
          break;

        case 'incremental':
          // Incremental sync (last 24 hours)
          const incrementalResults = await connector.productOperations.syncAll({
            updatedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000),
            limit: 500,
          });
          syncResults = incrementalResults;
          summary = {
            total: incrementalResults.length,
            successful: incrementalResults.filter(r => r.success).length,
            failed: incrementalResults.filter(r => !r.success).length,
          };
          break;

        case 'full':
        default:
          // Full sync
          const fullResults = await connector.productOperations.syncAll({
            limit: 2000, // Higher limit for full sync
          });
          syncResults = fullResults;
          summary = {
            total: fullResults.length,
            successful: fullResults.filter(r => r.success).length,
            failed: fullResults.filter(r => !r.success).length,
          };
          break;
      }

      // Update sync log with results
      if (syncLog?.id) {
        try {
          await (prisma() as any).platformSyncLog?.update({
            where: { id: syncLog.id },
            data: {
              status: summary.failed === 0 ? 'SUCCESS' : 'PARTIAL',
              completedAt: new Date(),
              itemsProcessed: summary.total,
              itemsSuccessful: summary.successful,
              itemsFailed: summary.failed,
              errors: summary.failed > 0 ? syncResults.filter(r => !r.success).map(r => r.error).filter(Boolean) : null,
            },
          });
        } catch (err) {
          console.log('Could not update sync log:', err);
        }
      }

      // Update integration status
      await prisma().shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: summary.failed === 0 ? 'SUCCESS' : 'PARTIAL',
          syncError: summary.failed > 0 ? `${summary.failed} items failed to sync` : null,
        },
      });

      return NextResponse.json({
        success: true,
        syncType,
        summary,
        syncLogId: syncLog?.id || null,
        message: `Sync completed: ${summary.successful}/${summary.total} items processed successfully`,
      });
    } catch (error) {
      // Update sync log with error
      if (syncLog?.id) {
        try {
          await (prisma() as any).platformSyncLog?.update({
            where: { id: syncLog.id },
            data: {
              status: 'ERROR',
              completedAt: new Date(),
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            },
          });
        } catch (err) {
          console.log('Could not update sync log with error:', err);
        }
      }

      // Update integration status
      await prisma().shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'ERROR',
          syncError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Shopify sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Shopify data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

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
