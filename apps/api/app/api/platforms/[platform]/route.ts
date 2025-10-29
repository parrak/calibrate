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
  context?: RouteParams
) {
  if (!context) {
    return NextResponse.json({ error: 'Missing route context' }, { status: 500 });
  }
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
  context?: RouteParams
) {
  if (!context) {
    return NextResponse.json({ error: 'Missing route context' }, { status: 500 });
  }
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

    // Create platform-specific integration
    if (platform === 'shopify') {
      // Shopify requires: shopDomain, accessToken, scope
      if (!credentials.shopDomain || !credentials.accessToken) {
        return NextResponse.json(
          { error: 'Shopify credentials require shopDomain and accessToken' },
          { status: 400 }
        );
      }

      const integration = await db.shopifyIntegration.upsert({
        where: { shopDomain: credentials.shopDomain },
        create: {
          projectId: project.id,
          shopDomain: credentials.shopDomain,
          accessToken: credentials.accessToken,
          scope: credentials.scope || 'read_products,write_products',
          isActive: true,
        },
        update: {
          projectId: project.id,
          accessToken: credentials.accessToken,
          scope: credentials.scope || 'read_products,write_products',
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        integration: {
          id: integration.id,
          platform: 'shopify',
          platformName: integration.shopDomain,
          isActive: integration.isActive,
          installedAt: integration.installedAt,
        },
      });
    } else if (platform === 'amazon') {
      // Amazon requires: sellerId, refreshToken
      if (!credentials.sellerId || !credentials.refreshToken) {
        return NextResponse.json(
          { error: 'Amazon credentials require sellerId and refreshToken' },
          { status: 400 }
        );
      }

      const integration = await db.amazonIntegration.upsert({
        where: {
          projectId_sellerId: {
            projectId: project.id,
            sellerId: credentials.sellerId,
          },
        },
        create: {
          projectId: project.id,
          sellerId: credentials.sellerId,
          marketplaceId: credentials.marketplaceId || 'ATVPDKIKX0DER',
          region: credentials.region || 'us-east-1',
          refreshToken: credentials.refreshToken,
          accessToken: credentials.accessToken,
          tokenExpiresAt: credentials.tokenExpiresAt,
          isActive: true,
        },
        update: {
          refreshToken: credentials.refreshToken,
          accessToken: credentials.accessToken,
          tokenExpiresAt: credentials.tokenExpiresAt,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        integration: {
          id: integration.id,
          platform: 'amazon',
          platformName: `Amazon ${integration.sellerId}`,
          isActive: integration.isActive,
          installedAt: integration.installedAt,
          metadata: {
            sellerId: integration.sellerId,
            marketplaceId: integration.marketplaceId,
            region: integration.region,
          },
        },
      });
    }

    return NextResponse.json(
      { error: `Platform '${platform}' not supported for integration creation` },
      { status: 400 }
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
  context?: RouteParams
) {
  if (!context) {
    return NextResponse.json({ error: 'Missing route context' }, { status: 500 });
  }
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

    // Deactivate platform-specific integration (soft delete)
    if (platform === 'shopify') {
      const result = await db.shopifyIntegration.updateMany({
        where: {
          projectId: project.id,
        },
        data: {
          isActive: false,
        },
      });

      if (result.count === 0) {
        return NextResponse.json(
          { error: 'No Shopify integration found for this project' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Shopify integration disconnected successfully',
      });
    } else if (platform === 'amazon') {
      const result = await db.amazonIntegration.updateMany({
        where: {
          projectId: project.id,
        },
        data: {
          isActive: false,
        },
      });

      if (result.count === 0) {
        return NextResponse.json(
          { error: 'No Amazon integration found for this project' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Amazon integration disconnected successfully',
      });
    }

    return NextResponse.json(
      { error: `Platform '${platform}' not supported for disconnection` },
      { status: 400 }
    );
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
