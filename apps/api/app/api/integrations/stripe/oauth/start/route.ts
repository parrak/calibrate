import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@calibr/connectors';
import { withSecurity } from '@/lib/security-headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withSecurity(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('project_id');

        if (!projectId) {
            return NextResponse.json(
                { error: 'project_id is required' },
                { status: 400 }
            );
        }

        const stripeService = new StripeService();
        // Encode state to pass context through OAuth flow
        const state = Buffer.from(JSON.stringify({ projectId })).toString('base64');

        const authUrl = stripeService.getOAuthUrl(state);

        return NextResponse.json({
            authUrl,
            projectId,
        });

    } catch (error) {
        console.error('Stripe OAuth start error:', error);
        return NextResponse.json(
            { error: 'Failed to generate OAuth URL' },
            { status: 500 }
        );
    }
});

export const OPTIONS = withSecurity(async (_req: NextRequest) => {
    return new NextResponse(null, { status: 204 });
});
