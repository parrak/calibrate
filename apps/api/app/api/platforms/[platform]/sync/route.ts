/**
 * Platform Sync API Route
 *
 * POST /api/platforms/[platform]/sync - Trigger platform sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import '@/lib/platforms/register'
import { prisma } from '@calibr/db';

export const runtime = 'nodejs';

interface RouteParams {
  params: {
    platform: string;
  };
}

/**
 * POST /api/platforms/[platform]/sync
 *
 * Trigger a sync operation for a platform integration
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { platform } = params;
    const body = await request.json();
    const { projectSlug, syncType = 'manual' } = body;

    if (!projectSlug) {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      );
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get platform integration
    const integration = await prisma.platformIntegration.findUnique({
      where: {
        projectId_platform: {
          projectId: project.id,
          platform,
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Platform integration not found' },
        { status: 404 }
      );
    }

    if (integration.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Platform is not connected' },
        { status: 400 }
      );
    }

    // Create sync log
    const syncLog = await prisma.platformSyncLog.create({
      data: {
        integrationId: integration.id,
        syncType,
        status: 'started',
      },
    });

    // Update integration sync status
    await prisma.platformIntegration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'SYNCING',
        lastSyncAt: new Date(),
      },
    });

    // Get connector
    const connector = await ConnectorRegistry.getConnector(
      platform as any,
      {
        platform: platform as any,
        name: integration.platformName,
        isActive: true,
      },
      integration.metadata as any
    );

    // Perform sync in background (in production, use a job queue)
    // For now, we'll do a simple sync
    performSync(connector, integration.id, syncLog.id).catch((error) => {
      console.error('Sync failed:', error);
    });

    return NextResponse.json({
      success: true,
      syncLog: {
        id: syncLog.id,
        status: syncLog.status,
        startedAt: syncLog.startedAt,
      },
      message: 'Sync started',
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to start sync',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Perform the actual sync operation
 * In production, this would be a background job
 */
async function performSync(
  connector: any,
  integrationId: string,
  syncLogId: string
) {
  try {
    // Sync products
    const result = await connector.products.syncAll();

    const successful = result.filter((r: any) => r.success).length;
    const failed = result.filter((r: any) => !r.success).length;

    // Update sync log
    await prisma.platformSyncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        itemsSynced: successful,
        itemsFailed: failed,
      },
    });

    // Update integration status
    await prisma.platformIntegration.update({
      where: { id: integrationId },
      data: {
        syncStatus: failed > 0 ? 'PARTIAL' : 'SUCCESS',
        syncError: failed > 0 ? `${failed} items failed to sync` : null,
      },
    });
  } catch (error) {
    // Update sync log with error
    await prisma.platformSyncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errors: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });

    // Update integration status
    await prisma.platformIntegration.update({
      where: { id: integrationId },
      data: {
        syncStatus: 'ERROR',
        syncError: error instanceof Error ? error.message : 'Sync failed',
      },
    });
  }
}
