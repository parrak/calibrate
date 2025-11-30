import Stripe from 'stripe'

export class StripeService {
    private stripe: Stripe

    constructor(apiKey?: string) {
        const key = apiKey || process.env.STRIPE_CLIENT_SECRET
        if (!key) {
            throw new Error('Stripe API Key is not defined')
        }
        this.stripe = new Stripe(key, {
            apiVersion: '2025-11-17.clover' as any,
            typescript: true,
        })
    }

    async getAccount() {
        return this.stripe.accounts.retrieve()
    }

    /**
     * List products from the connected account
     */
    async listProducts(limit = 100, startingAfter?: string) {
        return this.stripe.products.list({
            limit,
            starting_after: startingAfter,
        })
    }

    /**
     * List prices from the connected account
     */
    async listPrices(limit = 100, startingAfter?: string) {
        return this.stripe.prices.list({
            limit,
            starting_after: startingAfter,
        })
    }

    /**
     * List balance transactions (payments, refunds, fees)
     */
    async listBalanceTransactions(limit = 100, startingAfter?: string) {
        return this.stripe.balanceTransactions.list({
            limit,
            starting_after: startingAfter,
            expand: ['data.source'], // Expand source to get Charge/PaymentIntent details
        })
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string) {
        return this.stripe.webhooks.constructEvent(payload, signature, secret)
    }
}
