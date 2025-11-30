import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@calibr/connectors';
import { prisma } from '@calibr/db';
import { getEncryptionService } from '@calibr/security';
import { withSecurity } from '@/lib/security-headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = withSecurity(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle error from Stripe
        if (error) {
            const errorDescription = searchParams.get('error_description') || error;
            console.error('Stripe OAuth error:', error, errorDescription);
            // We don't have projectId here easily if state is missing/invalid, so we might fail to redirect to correct project
            // But usually state is passed back even on error.
            // For now, return JSON error or try to redirect if possible.
            return NextResponse.json({ error, description: errorDescription }, { status: 400 });
        }

        if (!code || !state) {
            return NextResponse.json(
                { error: 'Missing code or state' },
                { status: 400 }
            );
        }

        // Decode state
        let projectId: string;
        try {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            projectId = decoded.projectId;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid state format' }, { status: 400 });
        }

        if (!projectId) {
            return NextResponse.json(
                { error: 'Invalid state: missing projectId' },
                { status: 400 }
            );
        }

        const project = await prisma().project.findUnique({ where: { id: projectId } });
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const stripeService = new StripeService();
        const tokenResponse = await stripeService.authorize(code);

        const encryption = getEncryptionService();
        const encryptedAccessToken = tokenResponse.access_token ? encryption.encrypt(tokenResponse.access_token) : null;
        const encryptedRefreshToken = tokenResponse.refresh_token ? encryption.encrypt(tokenResponse.refresh_token) : null;

        // Save to DB
        await prisma().stripeAccount.upsert({
            where: { projectId },
            update: {
                stripeAccountId: tokenResponse.stripe_user_id,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                livemode: tokenResponse.livemode,
                scope: tokenResponse.scope,
                status: 'active',
            },
            create: {
                projectId,
                tenantId: project.tenantId,
                stripeAccountId: tokenResponse.stripe_user_id,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                livemode: tokenResponse.livemode,
                scope: tokenResponse.scope,
                status: 'active',
            }
        });

        // Redirect to success page
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_BASE;
        const redirectUrl = `${baseUrl}/p/${project.slug}/settings/connectors?success=stripe`;

        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error('Stripe OAuth callback error:', error);
        return NextResponse.json(
            { error: 'Failed to complete OAuth flow' },
            { status: 500 }
        );
    }
});
