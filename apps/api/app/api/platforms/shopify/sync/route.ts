/**
 * Shopify Sync Route
 * Handles manual synchronization triggers
 */
import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import { prisma } from '@calibr/db';
import '@/lib/platforms/register';

export const runtime = 'nodejs';

/**
 * POST /api/platforms/shopify/sync
 * 
 * Trigger manual synchronization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, syncType = 'full' } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
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

    // Create sync log entry
    const syncLog = await prisma().platformSyncLog.create({
      data: {
        integrationId: integration.id,
        syncType,
        status: 'SYNCING',
        startedAt: new Date(),
      },
    });

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
      await prisma().platformSyncLog.update({
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
        syncLogId: syncLog.id,
        message: `Sync completed: ${summary.successful}/${summary.total} items processed successfully`,
      });
    } catch (error) {
      // Update sync log with error
      await prisma().platformSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'ERROR',
          completedAt: new Date(),
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      });

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
}

/**
 * GET /api/platforms/shopify/sync/status
 * 
 * Get sync status and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
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

    // Get recent sync logs
    const syncLogs = await prisma().platformSyncLog.findMany({
      where: { integrationId: integration.id },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        platformName: integration.platformName,
        status: integration.status,
        syncStatus: integration.syncStatus,
        lastSyncAt: integration.lastSyncAt,
        syncError: integration.syncError,
      },
      syncLogs: syncLogs.map(log => ({
        id: log.id,
        syncType: log.syncType,
        status: log.status,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        itemsProcessed: log.itemsProcessed,
        itemsSuccessful: log.itemsSuccessful,
        itemsFailed: log.itemsFailed,
        errors: log.errors,
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
}
