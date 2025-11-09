/**
 * @calibr/analytics
 *
 * Analytics and reporting for pricing data
 */

export { aggregateDailySnapshots } from './aggregate'
export { getAnalyticsOverview } from './query'
export { detectAnomalies, detectStatisticalOutliers } from './anomaly'
export { generateWeeklyDigest } from './insights'
export type {
  DailySnapshot,
  AnalyticsOverview,
  AggregationConfig,
  AggregationResult,
  TrendData,
  SkuPerformance,
} from './types'
export type { PriceAnomaly, AnomalyDetectionConfig } from './anomaly'
export type { InsightDigest, Insight } from './insights'
