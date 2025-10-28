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
  params: {
    platform: string;
  };
}

/**
 * GET /api/platforms/[platform]
 *
 * Get platform information and connection status for a project
 */
export const GET = withSecurity(async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { platform } = params;
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
      include: {
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      platform,
      integration: integration || null,
      isConnected: integration?.status === 'CONNECTED',
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
  { params }: RouteParams
) {
  try {
    const { platform } = params;
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
    const project = await prisma.project.findUnique({
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

    // Create or update integration
    const integration = await prisma.platformIntegration.upsert({
      where: {
        projectId_platform: {
          projectId: project.id,
          platform,
        },
      },
      create: {
        projectId: project.id,
        platform,
        platformName,
        status: 'CONNECTED',
        isActive: true,
        metadata: credentials, // In production, encrypt this!
      },
      update: {
        platformName,
        status: 'CONNECTED',
        isActive: true,
        metadata: credentials, // In production, encrypt this!
        lastHealthCheck: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        platform: integration.platform,
        platformName: integration.platformName,
        status: integration.status,
        connectedAt: integration.connectedAt,
      },
    });
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
  { params }: RouteParams
) {
  try {
    const { platform } = params;
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('project');

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

    // Update integration status
    await prisma.platformIntegration.updateMany({
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
