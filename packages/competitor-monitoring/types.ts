export interface CompetitorData {
  id: string
  name: string
  domain: string
  channel: string
  isActive: boolean
  lastChecked?: Date
}

export interface CompetitorProductData {
  id: string
  competitorId: string
  skuId?: string
  name: string
  skuCode?: string
  url: string
  imageUrl?: string
  isActive: boolean
}

export interface CompetitorPriceData {
  id: string
  productId: string
  amount: number
  currency: string
  channel?: string
  isOnSale: boolean
  saleEndsAt?: Date
  stockStatus?: 'in_stock' | 'out_of_stock' | 'limited'
  createdAt: Date
}

export interface CompetitorRule {
  id: string
  name: string
  description?: string
  isActive: boolean
  rules: {
    type: 'beat_by_percent' | 'beat_by_amount' | 'match' | 'avoid_race_to_bottom'
    value?: number
    minMargin?: number
    maxPrice?: number
    minPrice?: number
    competitors?: string[]
    channels?: string[]
  }
}

export interface MonitoringResult {
  success: boolean
  competitorId: string
  productsChecked: number
  pricesUpdated: number
  errors: string[]
  duration: number
}

export interface PriceComparison {
  skuId: string
  ourPrice: number
  competitorPrices: {
    competitorId: string
    competitorName: string
    price: number
    currency: string
    isOnSale: boolean
    stockStatus?: string
  }[]
  suggestedPrice?: number
  ruleApplied?: string
}
