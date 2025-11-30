import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@calibr/connectors';
import { prisma } from '@calibr/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = async (request: NextRequest) => {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('STRIPE_WEBHOOK_SECRET is not defined');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const stripeService = new StripeService();
        let event;

        try {
            event = stripeService.verifyWebhookSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Idempotency check
        const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
        const existingEvent = await prisma().stripeWebhookEvent.findUnique({
            where: { eventId: event.id }
        });

        if (existingEvent) {
            return NextResponse.json({ received: true, status: 'already_processed' });
        }

        // Save event
        await prisma().stripeWebhookEvent.create({
            data: {
                eventId: event.id,
                type: event.type,
                payloadHash,
                status: 'processed'
            }
        });

        // TODO: Process event (e.g. create Transaction)
        // For now, we just acknowledge receipt.

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Stripe webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
};
