import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

const LEGACY_MESSAGE = NextResponse.json(
  {
    error: 'Endpoint deprecated',
    message: 'Use /api/integrations/shopify/sync for Shopify synchronization',
  },
  { status: 410 }
);

export const POST = withSecurity(async () => LEGACY_MESSAGE);
export const GET = withSecurity(async () => LEGACY_MESSAGE);
export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }));
