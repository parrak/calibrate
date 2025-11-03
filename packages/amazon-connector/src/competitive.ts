import { createSpApiClient, loadConfigFromEnv } from './spapi-client'

export interface CompetitivePriceData {
  asin: string
  marketplaceId: string
  currency: string
  lowestPrice: number | null
  buyBoxPrice: number | null
  offerCount: number
  offers?: Array<{ price: number; condition?: string; isBuyBox?: boolean }>
}

export async function getCompetitivePrice(asin: string): Promise<CompetitivePriceData> {
  const cfg = loadConfigFromEnv()
  const marketplaceId = cfg.marketplaceId || 'ATVPDKIKX0DER'
  const client = createSpApiClient(cfg)

  // Dry-run / no credentials: return mock data
  if (!client) {
    return {
      asin,
      marketplaceId,
      currency: 'USD',
      lowestPrice: 0,
      buyBoxPrice: null,
      offerCount: 0,
      offers: [],
    }
  }

  try {
    // Try common pricing endpoint. If not available, fall back gracefully.
    // SP-API Products Pricing: getItemOffers
    const api = client as any
    const res = await api.callAPI({
      operation: 'getItemOffers',
      path: { asin },
      query: { marketplaceId, ItemCondition: 'New' },
    })

    const summary = res.Summary || res.summary || {}
    const offers = (res.Offers || res.offers || []).map((o: any) => ({
      price: Number(o.ListingPrice?.Amount ?? o.Price?.ListingPrice?.Amount ?? 0),
      condition: o.Qualifiers?.ItemCondition || o.condition,
      isBuyBox: Boolean(o.IsBuyBoxWinner || o.isBuyBoxWinner),
    }))

    const currency =
      summary?.BuyBoxPrices?.[0]?.ListingPrice?.CurrencyCode ||
      offers?.[0]?.CurrencyCode ||
      'USD'

    const buyBox = offers.find((o: any) => o.isBuyBox) || null
    const lowest = offers.length ? Math.min(...offers.map((o: any) => Number(o.price || 0))) : null

    return {
      asin,
      marketplaceId,
      currency,
      lowestPrice: lowest,
      buyBoxPrice: buyBox ? Number(buyBox.price) : null,
      offerCount: Array.isArray(offers) ? offers.length : 0,
      offers,
    }
  } catch (err) {
    // On error, surface a safe, minimal structure
    return {
      asin,
      marketplaceId,
      currency: 'USD',
      lowestPrice: null,
      buyBoxPrice: null,
      offerCount: 0,
      offers: [],
    }
  }
}

