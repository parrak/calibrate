import { NextRequest, NextResponse } from 'next/server';
import { StripeService, StripeSync } from '@calibr/connectors';
import { withSecurity } from '@/lib/security-headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = withSecurity(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { projectId } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        const stripeService = new StripeService();
        const stripeSync = new StripeSync(stripeService);

        await stripeSync.syncCatalog(projectId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Stripe catalog sync error:', error);
        return NextResponse.json(
            { error: 'Failed to sync catalog' },
            { status: 500 }
        );
    }
});
