import { NextRequest, NextResponse } from 'next/server';
// import { StripeService } from '@calibr/connectors';
import { prisma } from '@calibr/db';
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

        const stripeAccount = await prisma().stripeAccount.findUnique({ where: { projectId } });
        if (!stripeAccount) {
            return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 });
        }

        // API Key integration does not require deauthorization from Stripe side
        // We just remove the key from our database

        // Remove from DB
        await prisma().stripeAccount.delete({ where: { projectId } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Stripe disconnect error:', error);
        return NextResponse.json(
            { error: 'Failed to disconnect Stripe account' },
            { status: 500 }
        );
    }
});
