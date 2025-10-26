/**
 * Platform API Routes
 *
 * GET /api/platforms - List all available platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';

export const runtime = 'nodejs';

/**
 * GET /api/platforms
 *
 * List all registered platform connectors
 */
export async function GET(request: NextRequest) {
  try {
    const platforms = ConnectorRegistry.getRegisteredPlatforms();

    // Get platform capabilities for each registered platform
    const platformsWithInfo = platforms.map((platform) => {
      // Platform metadata - this would be enhanced by each connector
      return {
        platform,
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        available: true,
      };
    });

    return NextResponse.json({
      platforms: platformsWithInfo,
      count: platformsWithInfo.length,
    });
  } catch (error) {
    console.error('Error listing platforms:', error);
    return NextResponse.json(
      {
        error: 'Failed to list platforms',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
