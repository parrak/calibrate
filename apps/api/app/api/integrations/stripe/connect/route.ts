import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@calibr/connectors';
import { prisma } from '@calibr/db';
import { getEncryptionService } from '@calibr/security';
import { withSecurity } from '@/lib/security-headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = withSecurity(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { projectId, apiKey } = body;

        if (!projectId || !apiKey) {
            return NextResponse.json({ error: 'projectId and apiKey are required' }, { status: 400 });
        }

        // Validate API Key
        try {
            const stripeService = new StripeService(apiKey);
            const account = await stripeService.getAccount();

            // Encrypt API Key
            const encryption = getEncryptionService();
            const encryptedKey = encryption.encrypt(apiKey);

            // Save to DB
            await prisma().stripeAccount.upsert({
                where: { projectId },
                update: {
                    stripeAccountId: account.id,
                    secretKey: encryptedKey,
                    livemode: account.settings?.dashboard?.display_name ? true : false, // Heuristic or check key prefix
                    status: 'active',
                },
                create: {
                    projectId,
                    tenantId: (await prisma().project.findUnique({ where: { id: projectId } }))?.tenantId || '',
                    stripeAccountId: account.id,
                    secretKey: encryptedKey,
                    livemode: apiKey.startsWith('sk_live'),
                    status: 'active',
                }
            });

            return NextResponse.json({ success: true, accountId: account.id });

        } catch (e: unknown) {
            console.error('Stripe validation error:', e);
            return NextResponse.json({ error: 'Invalid API Key or connection failed' }, { status: 400 });
        }

    } catch (error) {
        console.error('Stripe connect error:', error);
        return NextResponse.json(
            { error: 'Failed to connect Stripe account' },
            { status: 500 }
        );
    }
});
