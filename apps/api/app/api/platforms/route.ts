/**
 * Platform API Routes
 *
 * GET /api/platforms - List all available platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConnectorRegistry } from '@calibr/platform-connector';
import { withSecurity } from '@/lib/security-headers';
import '@/lib/platforms/register'

export const runtime = 'nodejs';

/**
 * GET /api/platforms
 *
 * List all registered platform connectors
 */
export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const platforms = ConnectorRegistry.getRegisteredPlatforms();

    // Get platform capabilities for each registered platform
    const platformsWithInfo = platforms.map((platform) => {
      // Platform metadata with better naming
      let name: string = platform;
      let description = '';
      
      switch (platform) {
        case 'shopify':
          name = 'Shopify';
          description = 'Connect your Shopify store to manage products and pricing';
          break;
        case 'amazon':
          name = 'Amazon';
          description = 'Connect to Amazon Seller Central for product and pricing management';
          break;
        default:
          name = platform.charAt(0).toUpperCase() + platform.slice(1);
      }
      
      return {
        platform,
        name,
        description,
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
});

/**
 * OPTIONS handler for CORS preflight
 */
export const OPTIONS = withSecurity(async () => {
  return new NextResponse(null, { status: 204 });
});
