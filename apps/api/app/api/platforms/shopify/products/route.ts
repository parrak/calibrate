import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-headers';

export const runtime = 'nodejs';

const LEGACY_RESPONSE = NextResponse.json(
  {
    error: 'Endpoint deprecated',
    message: 'Use /api/integrations/shopify/products for product operations',
  },
  { status: 410 }
);

export const GET = withSecurity(async () => LEGACY_RESPONSE);

export const POST = withSecurity(async () => LEGACY_RESPONSE);

export const OPTIONS = withSecurity(async () => new NextResponse(null, { status: 204 }));
