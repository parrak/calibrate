/**
 * Analytics Module Types
 */

/**
 * Daily snapshot of pricing and sales data
 */
export interface DailySnapshot {
  /** Project identifier */
  projectId: string

  /** Snapshot date */
  date: Date

  /** Total active SKUs */
  totalSkus: number

  /** Price change metrics */
  priceChanges: {
    total: number
    approved: number
    rejected: number
    pending: number
    applied: number
  }

  /** Sales metrics */
  sales?: {
    totalRevenue: number
    totalUnits: number
    averageOrderValue: number
  }

  /** Pricing metrics */
  pricing: {
    averagePrice: number
    minPrice: number
    maxPrice: number
    medianPrice: number
  }

  /** Margin metrics (if cost data available) */
  margins?: {
    averageMargin: number
    minMargin: number
    maxMargin: number
  }

  /** Competitor insights */
  competitorInsights?: {
    totalCompetitorsSampled: number
    averageCompetitiveDelta: number
    pricesBelowMarket: number
    pricesAboveMarket: number
  }
}

/**
 * Analytics overview response
 */
export interface AnalyticsOverview {
  /** Project ID */
  projectId: string

  /** Time range */
  period: {
    start: Date
    end: Date
    days: number
  }

  /** Key metrics summary */
  summary: {
    totalSkus: number
    totalPriceChanges: number
    averageChangePerDay: number
    approvalRate: number
  }

  /** Trend data */
  trends: {
    revenue?: TrendData
    units?: TrendData
    averagePrice: TrendData
    priceChanges: TrendData
  }

  /** Top performers */
  topPerformers?: {
    bySales: SkuPerformance[]
    byMargin: SkuPerformance[]
  }

  /** Recent snapshots */
  snapshots: DailySnapshot[]
}

export interface TrendData {
  /** Current value */
  current: number

  /** Previous period value */
  previous: number

  /** Change amount */
  change: number

  /** Change percentage */
  changePercent: number

  /** Trend direction */
  direction: 'up' | 'down' | 'stable'

  /** Data points over time */
  dataPoints?: { date: Date; value: number }[]
}

export interface SkuPerformance {
  sku: string
  name?: string
  revenue?: number
  units?: number
  margin?: number
  price: number
}

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  /** Projects to aggregate (empty = all) */
  projectIds?: string[]

  /** Start date (default: yesterday) */
  startDate?: Date

  /** End date (default: today) */
  endDate?: Date

  /** Include sales data */
  includeSales?: boolean

  /** Include competitor data */
  includeCompetitorData?: boolean
}

/**
 * Aggregation result
 */
export interface AggregationResult {
  /** Number of snapshots created */
  snapshotsCreated: number

  /** Projects processed */
  projectsProcessed: string[]

  /** Errors encountered */
  errors: Array<{
    projectId: string
    error: string
  }>

  /** Processing time in ms */
  duration: number
}
