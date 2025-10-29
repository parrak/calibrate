/**
 * Platform-specific API Routes
 *
 * GET    /api/platforms/[platform] - Get platform info
 * POST   /api/platforms/[platform] - Connect to platform
 * DELETE /api/platforms/[platform] - Disconnect from platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import '@/lib/platforms/register'
import { prisma } from '@calibr/db';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    platform: string;
  }>;
}

/**
 * GET /api/platforms/[platform]
 *
 * Get platform information and connection status for a project
 */
export const GET = withSecurity(async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    let db;
    try {
      db = prisma()
    } catch (prismaError) {
      console.error('[platform GET] Failed to get Prisma client:', prismaError)
      return NextResponse.json({
        error: 'Database initialization failed',
        details: prismaError instanceof Error ? prismaError.message : 'Unknown error'
      }, { status: 500 })
    }

    if (!db) {
      console.error('[platform GET] Prisma client is undefined')
      return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 })
    }
    if (!(db as any)?.project) {
      console.error('[platform GET] Prisma client missing model accessors', { hasDb: !!db, dbKeys: Object.keys(db || {}) })
      return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 })
    }
    const { platform } = await context.params;
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('project');

    if (!projectSlug) {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      );
    }

    // Check if platform is registered
    if (!ConnectorRegistry.isRegistered(platform as any)) {
      return NextResponse.json(
        { error: `Platform '${platform}' is not registered` },
        { status: 404 }
      );
    }

    // Get project
    const project = await db.project.findUnique({
      where: { slug: projectSlug },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get platform integration
    // Check platform-specific integration models
    let integration = null;
    let isConnected = false;

    if (platform === 'shopify') {
      const shopifyIntegration = await db.shopifyIntegration.findFirst({
        where: { projectId: project.id },
      });
      if (shopifyIntegration) {
        integration = {
          id: shopifyIntegration.id,
          platform: 'shopify',
          platformName: shopifyIntegration.shopDomain,
          status: shopifyIntegration.isActive ? 'CONNECTED' : 'DISCONNECTED',
          lastSyncAt: shopifyIntegration.lastSyncAt,
          syncStatus: shopifyIntegration.syncStatus,
        };
        isConnected = shopifyIntegration.isActive;
      }
    } else if (platform === 'amazon') {
      const amazonIntegration = await db.amazonIntegration.findFirst({
        where: { projectId: project.id },
      });
      if (amazonIntegration) {
        integration = {
          id: amazonIntegration.id,
          platform: 'amazon',
          platformName: `Amazon ${amazonIntegration.sellerId}`,
          status: amazonIntegration.isActive ? 'CONNECTED' : 'DISCONNECTED',
          lastSyncAt: amazonIntegration.lastSyncAt,
          syncStatus: amazonIntegration.syncStatus,
          metadata: {
            sellerId: amazonIntegration.sellerId,
            marketplaceId: amazonIntegration.marketplaceId,
            region: amazonIntegration.region,
          },
        };
        isConnected = amazonIntegration.isActive;
      }
    }
    // Other platforms will be added as needed

    return NextResponse.json({
      platform,
      integration,
      isConnected,
    });
  } catch (error) {
    console.error('Error getting platform info:', error);
    return NextResponse.json(
      {
        error: 'Failed to get platform information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/platforms/[platform]
 *
 * Connect to a platform
 */
export const POST = withSecurity(async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const db = prisma()
    const { platform } = await context.params;
    const body = await request.json();
    const { projectSlug, platformName, credentials } = body;

    if (!projectSlug || !platformName || !credentials) {
      return NextResponse.json(
        { error: 'Project slug, platform name, and credentials are required' },
        { status: 400 }
      );
    }

    // Check if platform is registered
    if (!ConnectorRegistry.isRegistered(platform as any)) {
      return NextResponse.json(
        { error: `Platform '${platform}' is not registered` },
        { status: 404 }
      );
    }

    // Get project
    const project = await db.project.findUnique({
      where: { slug: projectSlug },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Test connection with credentials
    const connector = await ConnectorRegistry.createConnector(
      platform as any,
      {
        platform: platform as any,
        name: platformName,
        isActive: true,
      },
      {
        ...credentials,
        platform,
      }
    );

    const isConnected = await connector.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to platform. Please check your credentials.' },
        { status: 400 }
      );
    }

    // TODO: Create platform-specific integration
    // Schema only has ShopifyIntegration currently, not generic PlatformIntegration
    return NextResponse.json(
      {
        error: 'Platform integration not implemented',
        message: `Creating ${platform} integrations requires adding ${platform}Integration model to schema`,
      },
      { status: 501 } // Not Implemented
    );
  } catch (error) {
    console.error('Error connecting to platform:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to platform',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/platforms/[platform]
 *
 * Disconnect from a platform
 */
export const DELETE = withSecurity(async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const db = prisma()
    const { platform } = await context.params;
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('project');

    if (!projectSlug) {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      );
    }

    // Get project
    const project = await db.project.findUnique({
      where: { slug: projectSlug },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update integration status
    await db.platformIntegration.updateMany({
      where: {
        projectId: project.id,
        platform,
      },
      data: {
        status: 'DISCONNECTED',
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Platform disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json(
      {
        error: 'Failed to disconnect platform',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204 });
});
