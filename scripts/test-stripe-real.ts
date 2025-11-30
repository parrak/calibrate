
import { StripeService } from '../packages/connectors/src/stripe/StripeService'

async function main() {
    const apiKey = process.env.STRIPE_SECRET_KEY

    if (!apiKey) {
        console.error('❌ STRIPE_SECRET_KEY not found in apps/api/.env')
        console.error('Please add your Secret Key (sk_...) to apps/api/.env')
        process.exit(1)
    }

    if (apiKey.startsWith('pk_')) {
        console.error('❌ You provided a Publishable Key (pk_...). You must use a Secret Key (sk_...) or Restricted Key (rk_...).')
        process.exit(1)
    }

    console.log(`Testing connection with key: ${apiKey.substring(0, 8)}...`)

    try {
        const service = new StripeService(apiKey)

        console.log('Fetching account details...')
        const account = await service.getAccount()
        console.log('✅ Connected to account:', account.id, account.business_profile?.name || account.email)

        console.log('Fetching recent balance transactions...')
        const response = await service.listBalanceTransactions(5)
        const transactions = response.data
        console.log(`✅ Found ${transactions.length} transactions`)
        transactions.forEach((t: any) => {
            console.log(`   - ${new Date(t.created * 1000).toISOString()} | ${t.amount / 100} ${t.currency.toUpperCase()} | ${t.type}`)
        })

        console.log('\nFetching products...')
        const productsRes = await service.listProducts(5)
        const products = productsRes.data
        console.log(`✅ Found ${products.length} products`)
        products.forEach((p: any) => {
            console.log(`   - ${p.name} (${p.id})`)
        })

        console.log('\nFetching prices...')
        const pricesRes = await service.listPrices(5)
        const prices = pricesRes.data
        console.log(`✅ Found ${prices.length} prices`)
        prices.forEach((p: any) => {
            console.log(`   - ${p.unit_amount ? p.unit_amount / 100 : 0} ${p.currency.toUpperCase()} (${p.id})`)
        })
    } catch (error: any) {
        console.error('❌ Connection failed:', error.message)
    }
}

main()
