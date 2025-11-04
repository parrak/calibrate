import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

/**
 * Legacy endpoint for backward compatibility
 * Delegates to /api/integrations/shopify/sync
 */
export const POST = withSecurity(async (request: NextRequest) => {
  try {
    const body = await request.json() as {
      projectSlug?: string;
      projectId?: string;
      syncType?: string;
    };

    // Map syncType to action for integrations endpoint
    // 'full' -> 'sync_products', 'incremental' -> 'sync_products', etc.
    const action = body.syncType === 'full' || body.syncType === 'incremental' || !body.syncType
      ? 'sync_products'
      : body.syncType;

    // Forward request to integrations endpoint using internal URL
    // Use the request URL to construct internal endpoint
    const url = new URL(request.url);
    const protocol = url.protocol;
    const host = url.host;
    const integrationsUrl = `${protocol}//${host}/api/integrations/shopify/sync`;

    const response = await fetch(integrationsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward relevant headers
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify({
        projectSlug: body.projectSlug,
        projectId: body.projectId,
        action,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding to integrations endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to forward sync request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

export const GET = withSecurity(async () => {
  return NextResponse.json(
    {
      error: 'Endpoint deprecated',
      message: 'Use /api/integrations/shopify/sync for Shopify synchronization',
    },
    { status: 410 }
  );
});

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }));
