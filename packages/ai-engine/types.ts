/**
 * AI Pricing Engine Types
 */

/**
 * Input data for AI price suggestion
 */
export interface PriceSuggestionInput {
  /** Current SKU identifier */
  sku: string

  /** Current price in cents */
  currentPrice: number

  /** Currency code (ISO 4217) */
  currency: string

  /** Historical pricing data */
  priceHistory?: PriceHistoryPoint[]

  /** Competitor pricing data */
  competitorPrices?: CompetitorPrice[]

  /** Sales velocity metrics */
  salesVelocity?: SalesVelocity

  /** Optional cost data */
  cost?: number

  /** Optional inventory level */
  inventory?: number
}

export interface PriceHistoryPoint {
  /** Timestamp */
  date: Date

  /** Price in cents */
  price: number

  /** Units sold at this price */
  unitsSold?: number

  /** Revenue generated */
  revenue?: number
}

export interface CompetitorPrice {
  /** Competitor identifier */
  competitorId: string

  /** Competitor name */
  competitorName?: string

  /** Competitor's price in cents */
  price: number

  /** When price was observed */
  observedAt: Date

  /** Product URL */
  url?: string
}

export interface SalesVelocity {
  /** Units sold in last 7 days */
  last7Days: number

  /** Units sold in last 30 days */
  last30Days: number

  /** Units sold in last 90 days */
  last90Days?: number

  /** Average daily sales */
  averageDailySales: number

  /** Trend direction */
  trend?: 'increasing' | 'stable' | 'decreasing'
}

/**
 * AI-generated price suggestion output
 */
export interface PriceSuggestion {
  /** Suggested price delta in cents (can be negative) */
  delta: number

  /** Suggested new price in cents */
  suggestedPrice: number

  /** Confidence score (0-1) */
  confidence: number

  /** Human-readable rationale */
  rationale: string

  /** Detailed reasoning breakdown */
  reasoning: PriceReasoning

  /** Timestamp of suggestion */
  generatedAt: Date
}

export interface PriceReasoning {
  /** Market position analysis */
  marketPosition?: {
    percentile: number
    belowAverage: boolean
    lowestPrice?: number
    highestPrice?: number
    averagePrice?: number
  }

  /** Sales performance factor */
  salesPerformance?: {
    velocity: 'high' | 'medium' | 'low'
    trend: 'increasing' | 'stable' | 'decreasing'
    message: string
  }

  /** Margin analysis */
  marginAnalysis?: {
    currentMargin?: number
    suggestedMargin?: number
    maintainsMinMargin: boolean
  }

  /** Factors considered */
  factors: string[]

  /** Weights applied */
  weights?: Record<string, number>
}

/**
 * Configuration for AI pricing engine
 */
export interface AIEngineConfig {
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number

  /** Maximum price change percentage */
  maxChangePercent?: number

  /** Minimum margin percentage */
  minMarginPercent?: number

  /** Enable competitor-based pricing */
  useCompetitorData?: boolean

  /** Enable sales velocity weighting */
  useSalesVelocity?: boolean

  /** Custom weights for factors */
  customWeights?: {
    competitorInfluence?: number
    salesVelocityInfluence?: number
    historicalInfluence?: number
  }
}
