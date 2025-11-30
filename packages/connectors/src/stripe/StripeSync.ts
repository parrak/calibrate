import { prisma } from '@calibr/db'
import { StripeService } from './StripeService'
import { getEncryptionService } from '@calibr/security'

export class StripeSync {
    constructor() { }

    private async getStripeService(projectId: string): Promise<StripeService> {
        const account = await prisma().stripeAccount.findUnique({ where: { projectId } })
        if (!account) throw new Error('Stripe account not connected')
        if (!account.secretKey) throw new Error('Stripe API key not found')

        const encryption = getEncryptionService()
        const secretKey = encryption.decrypt(account.secretKey)

        return new StripeService(secretKey)
    }

    async syncCatalog(projectId: string) {
        const stripeService = await this.getStripeService(projectId)
        const account = await prisma().stripeAccount.findUnique({ where: { projectId } })
        if (!account) throw new Error('Stripe account not connected')

        // Sync Products
        let hasMore = true
        let startingAfter: string | undefined

        while (hasMore) {
            const products = await stripeService.listProducts(100, startingAfter)

            for (const product of products.data) {
                const map = await prisma().stripeProductMap.findUnique({
                    where: { projectId_stripeProductId: { projectId, stripeProductId: product.id } }
                })

                if (!map) {
                    // Create Product
                    const newProduct = await prisma().product.create({
                        data: {
                            tenantId: account.tenantId,
                            projectId,
                            name: product.name,
                            code: product.id, // Use Stripe ID as code
                            status: product.active ? 'ACTIVE' : 'ARCHIVED',
                        }
                    })

                    // Create Map
                    await prisma().stripeProductMap.create({
                        data: {
                            projectId,
                            productId: newProduct.id,
                            stripeProductId: product.id
                        }
                    })
                } else {
                    // Update Product
                    await prisma().product.update({
                        where: { id: map.productId },
                        data: {
                            name: product.name,
                            status: product.active ? 'ACTIVE' : 'ARCHIVED',
                        }
                    })
                }
            }

            hasMore = products.has_more
            if (products.data.length > 0) {
                startingAfter = products.data[products.data.length - 1].id
            } else {
                hasMore = false
            }
        }

        // Sync Prices
        hasMore = true
        startingAfter = undefined

        while (hasMore) {
            const prices = await stripeService.listPrices(100, startingAfter)

            for (const price of prices.data) {
                const map = await prisma().stripePriceMap.findUnique({
                    where: { projectId_stripePriceId: { projectId, stripePriceId: price.id } }
                })

                // Find linked product
                const productMap = await prisma().stripeProductMap.findUnique({
                    where: { projectId_stripeProductId: { projectId, stripeProductId: price.product as string } }
                })

                if (!productMap) continue; // Skip if product not found (shouldn't happen if we sync products first)

                // Find SKU for product (create default SKU if none)
                let sku = await prisma().sku.findFirst({
                    where: { productId: productMap.productId }
                })

                if (!sku) {
                    sku = await prisma().sku.create({
                        data: {
                            productId: productMap.productId,
                            name: 'Default SKU',
                            code: `${productMap.productId}-default`,
                            status: 'ACTIVE'
                        }
                    })
                }

                if (!map) {
                    // Create Price
                    const newPrice = await prisma().price.create({
                        data: {
                            skuId: sku.id,
                            currency: price.currency,
                            amount: price.unit_amount || 0,
                            status: price.active ? 'ACTIVE' : 'ARCHIVED',
                        }
                    })

                    await prisma().stripePriceMap.create({
                        data: {
                            projectId,
                            priceId: newPrice.id,
                            stripePriceId: price.id
                        }
                    })
                } else {
                    // Update Price
                    await prisma().price.update({
                        where: { id: map.priceId },
                        data: {
                            amount: price.unit_amount || 0,
                            status: price.active ? 'ACTIVE' : 'ARCHIVED',
                        }
                    })
                }
            }

            hasMore = prices.has_more
            if (prices.data.length > 0) {
                startingAfter = prices.data[prices.data.length - 1].id
            } else {
                hasMore = false
            }
        }
    }

    async syncTransactions(projectId: string) {
        const stripeService = await this.getStripeService(projectId)
        const account = await prisma().stripeAccount.findUnique({ where: { projectId } })
        if (!account) throw new Error('Stripe account not connected')

        let hasMore = true
        let startingAfter: string | undefined

        while (hasMore) {
            const txns = await stripeService.listBalanceTransactions(100, startingAfter)

            for (const txn of txns.data) {
                // Only process charges/payments for now
                if (txn.type !== 'charge' && txn.type !== 'payment') continue;

                const existing = await prisma().transaction.findUnique({
                    where: { projectId_source_externalId: { projectId, source: 'stripe', externalId: txn.id } }
                })

                if (existing) continue;

                await prisma().transaction.create({
                    data: {
                        tenantId: account.tenantId,
                        projectId,
                        source: 'stripe',
                        externalId: txn.id,
                        amount: txn.amount,
                        currency: txn.currency,
                        status: txn.status,
                        feeAmount: txn.fee,
                        netAmount: txn.net,
                        occurredAt: new Date(txn.created * 1000),
                        // productId, skuId left null for now
                    }
                })
            }

            hasMore = txns.has_more
            if (txns.data.length > 0) {
                startingAfter = txns.data[txns.data.length - 1].id
            } else {
                hasMore = false
            }
        }
    }
}
