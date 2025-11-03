import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    platform: string;
  }>;
}

export const POST = withSecurity(async (request: NextRequest, context?: RouteParams) => {
  const platform = context ? (await context.params).platform : 'unknown';

  // Placeholder implementation until platform-specific sync handlers are available
  return NextResponse.json(
    {
      error: 'Platform sync endpoint is not yet implemented',
      platform,
      requestId: request.headers.get('x-request-id') ?? null,
    },
    { status: 501 }
  );
});

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }));
