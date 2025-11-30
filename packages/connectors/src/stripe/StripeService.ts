import Stripe from 'stripe'

export class StripeService {
    private stripe: Stripe

    constructor() {
        if (!process.env.STRIPE_CLIENT_SECRET) {
            throw new Error('STRIPE_CLIENT_SECRET is not defined')
        }
        this.stripe = new Stripe(process.env.STRIPE_CLIENT_SECRET, {
            apiVersion: '2025-11-17.clover' as any,
            typescript: true,
        })
    }

    getOAuthUrl(state: string): string {
        const clientId = process.env.STRIPE_CLIENT_ID
        if (!clientId) throw new Error('STRIPE_CLIENT_ID is not defined')

        const redirectUri = `${process.env.NEXT_PUBLIC_API_BASE}/api/integrations/stripe/oauth/callback`

        const args = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: 'read_write',
            redirect_uri: redirectUri,
            state: state,
        })

        return `https://connect.stripe.com/oauth/authorize?${args.toString()}`
    }

    async authorize(code: string) {
        return this.stripe.oauth.token({
            grant_type: 'authorization_code',
            code,
        })
    }

    async deauthorize(stripeUserId: string) {
        const clientId = process.env.STRIPE_CLIENT_ID
        if (!clientId) throw new Error('STRIPE_CLIENT_ID is not defined')
        return this.stripe.oauth.deauthorize({
            client_id: clientId,
            stripe_user_id: stripeUserId,
        })
    }

    async getAccount(accountId: string) {
        return this.stripe.accounts.retrieve(accountId)
    }

    /**
     * List products from a connected account
     */
    async listProducts(stripeAccountId: string, limit = 100, startingAfter?: string) {
        return this.stripe.products.list({
            limit,
            starting_after: startingAfter,
        }, {
            stripeAccount: stripeAccountId,
        })
    }

    /**
     * List prices from a connected account
     */
    async listPrices(stripeAccountId: string, limit = 100, startingAfter?: string) {
        return this.stripe.prices.list({
            limit,
            starting_after: startingAfter,
        }, {
            stripeAccount: stripeAccountId,
        })
    }

    /**
     * List balance transactions (payments, refunds, fees)
     */
    async listBalanceTransactions(stripeAccountId: string, limit = 100, startingAfter?: string) {
        return this.stripe.balanceTransactions.list({
            limit,
            starting_after: startingAfter,
            expand: ['source'], // Expand source to get Charge/PaymentIntent details
        }, {
            stripeAccount: stripeAccountId,
        })
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string) {
        return this.stripe.webhooks.constructEvent(payload, signature, secret)
    }
}
