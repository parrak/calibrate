/**
 * Anomaly Detection for Pricing Analytics
 *
 * Detects unusual patterns in pricing data including:
 * - Price spikes or drops beyond threshold
 * - Sudden changes in price change volume
 * - Margin compression alerts
 * - Unusual competitor deltas
 */

import { prisma } from '@calibr/db'

export interface PriceAnomaly {
  /** Anomaly type */
  type: 'price_spike' | 'price_drop' | 'volume_spike' | 'margin_compression' | 'competitor_divergence'

  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'

  /** When detected */
  detectedAt: Date

  /** Affected SKU or project */
  affectedId: string
  affectedName?: string

  /** Anomaly details */
  details: {
    metric: string
    currentValue: number
    expectedValue: number
    deviationPercent: number
    threshold: number
  }

  /** Suggested action */
  recommendation: string
}

export interface AnomalyDetectionConfig {
  /** Price change threshold (%) */
  priceChangeThreshold?: number

  /** Volume spike threshold (%) */
  volumeSpikeThreshold?: number

  /** Margin compression threshold (%) */
  marginThreshold?: number

  /** Competitor delta threshold (%) */
  competitorDeltaThreshold?: number

  /** Statistical significance level */
  significanceLevel?: number
}

const DEFAULT_CONFIG: Required<AnomalyDetectionConfig> = {
  priceChangeThreshold: 20, // 20% price change
  volumeSpikeThreshold: 200, // 200% increase in volume
  marginThreshold: 10, // 10% margin drop
  competitorDeltaThreshold: 15, // 15% deviation from competitors
  significanceLevel: 2.0, // 2 standard deviations
}

/**
 * Detect pricing anomalies for a project
 */
export async function detectAnomalies(
  projectId: string,
  config: AnomalyDetectionConfig = {}
): Promise<PriceAnomaly[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const anomalies: PriceAnomaly[] = []

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 1. Detect sudden price spikes/drops
  const priceAnomalies = await detectPriceAnomalies(projectId, cfg, oneDayAgo)
  anomalies.push(...priceAnomalies)

  // 2. Detect volume spikes (sudden increase in price changes)
  const volumeAnomalies = await detectVolumeAnomalies(projectId, cfg, sevenDaysAgo, oneDayAgo)
  anomalies.push(...volumeAnomalies)

  // 3. Detect margin compression
  const marginAnomalies = await detectMarginAnomalies(projectId, cfg, oneDayAgo)
  anomalies.push(...marginAnomalies)

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * Detect sudden price spikes or drops
 */
async function detectPriceAnomalies(
  projectId: string,
  config: Required<AnomalyDetectionConfig>,
  since: Date
): Promise<PriceAnomaly[]> {
  const anomalies: PriceAnomaly[] = []

  // Get recent price changes
  const priceChanges = await prisma().priceChange.findMany({
    where: {
      projectId,
      createdAt: { gte: since },
      status: { in: ['PENDING', 'APPROVED', 'APPLIED'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get SKU info for affected SKUs
  const skuIds = Array.from(new Set(priceChanges.map(pc => pc.skuId)))
  const skus = await prisma().sku.findMany({
    where: { id: { in: skuIds } },
    select: { id: true, code: true, name: true },
  })
  const skuMap = new Map(skus.map(s => [s.id, s]))

  for (const change of priceChanges) {
    const deltaPercent = Math.abs(((change.toAmount - change.fromAmount) / change.fromAmount) * 100)

    if (deltaPercent > config.priceChangeThreshold) {
      const isSpike = change.toAmount > change.fromAmount
      const sku = skuMap.get(change.skuId)

      anomalies.push({
        type: isSpike ? 'price_spike' : 'price_drop',
        severity: deltaPercent > 50 ? 'critical' : deltaPercent > 30 ? 'high' : 'medium',
        detectedAt: new Date(),
        affectedId: change.skuId,
        affectedName: sku?.name || sku?.code || change.skuId,
        details: {
          metric: 'Price Change',
          currentValue: change.toAmount,
          expectedValue: change.fromAmount,
          deviationPercent: deltaPercent,
          threshold: config.priceChangeThreshold,
        },
        recommendation: isSpike
          ? `Review large price increase of ${deltaPercent.toFixed(1)}% for ${sku?.name || sku?.code || change.skuId}. Verify this aligns with market conditions.`
          : `Investigate significant price drop of ${deltaPercent.toFixed(1)}% for ${sku?.name || sku?.code || change.skuId}. Ensure margins remain healthy.`,
      })
    }
  }

  return anomalies
}

/**
 * Detect unusual spikes in price change volume
 */
async function detectVolumeAnomalies(
  projectId: string,
  config: Required<AnomalyDetectionConfig>,
  baselineStart: Date,
  recentStart: Date
): Promise<PriceAnomaly[]> {
  const anomalies: PriceAnomaly[] = []

  // Get baseline volume (older period)
  const baselineChanges = await prisma().priceChange.count({
    where: {
      projectId,
      createdAt: {
        gte: baselineStart,
        lt: recentStart,
      },
    },
  })

  // Get recent volume
  const recentChanges = await prisma().priceChange.count({
    where: {
      projectId,
      createdAt: { gte: recentStart },
    },
  })

  if (baselineChanges > 0) {
    const volumeIncreasePercent = ((recentChanges - baselineChanges) / baselineChanges) * 100

    if (volumeIncreasePercent > config.volumeSpikeThreshold) {
      anomalies.push({
        type: 'volume_spike',
        severity: volumeIncreasePercent > 500 ? 'critical' : volumeIncreasePercent > 300 ? 'high' : 'medium',
        detectedAt: new Date(),
        affectedId: projectId,
        affectedName: 'Project',
        details: {
          metric: 'Price Change Volume',
          currentValue: recentChanges,
          expectedValue: baselineChanges,
          deviationPercent: volumeIncreasePercent,
          threshold: config.volumeSpikeThreshold,
        },
        recommendation: `Unusual surge in price change activity (${volumeIncreasePercent.toFixed(0)}% increase). Review recent pricing operations for errors or unauthorized changes.`,
      })
    }
  }

  return anomalies
}

/**
 * Detect margin compression (declining margins)
 */
async function detectMarginAnomalies(
  projectId: string,
  config: Required<AnomalyDetectionConfig>,
  since: Date
): Promise<PriceAnomaly[]> {
  const anomalies: PriceAnomaly[] = []

  // Get SKUs with cost data
  const skus = await prisma().sku.findMany({
    where: {
      Product: { projectId },
    },
    select: {
      id: true,
      code: true,
      name: true,
      attributes: true,
      Price: {
        where: { status: 'ACTIVE' },
        select: { amount: true },
        take: 1,
      },
    },
  })

  // Get recent price changes for these SKUs
  const skuIds = skus.map(s => s.id)
  const recentPriceChanges = await prisma().priceChange.findMany({
    where: {
      skuId: { in: skuIds },
      createdAt: { gte: since },
      status: { in: ['APPROVED', 'APPLIED'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      skuId: true,
      fromAmount: true,
      toAmount: true,
    },
  })

  // Map price changes by SKU ID (get most recent for each SKU)
  const priceChangeMap = new Map<string, { fromAmount: number; toAmount: number }>()
  for (const pc of recentPriceChanges) {
    if (!priceChangeMap.has(pc.skuId)) {
      priceChangeMap.set(pc.skuId, { fromAmount: pc.fromAmount, toAmount: pc.toAmount })
    }
  }

  for (const sku of skus) {
    // Extract cost from attributes
    const cost = sku.attributes && typeof sku.attributes === 'object' && 'cost' in sku.attributes
      ? (sku.attributes as any).cost
      : null

    if (!cost || cost <= 0) continue

    const currentPrice = sku.Price[0]?.amount
    if (!currentPrice) continue

    const currentMarginPercent = ((currentPrice - cost) / cost) * 100

    // Check if recent price change compressed margin
    const recentChange = priceChangeMap.get(sku.id)
    if (recentChange) {
      const previousMarginPercent = ((recentChange.fromAmount - cost) / cost) * 100
      const marginDrop = previousMarginPercent - currentMarginPercent

      if (marginDrop > config.marginThreshold) {
        anomalies.push({
          type: 'margin_compression',
          severity: marginDrop > 25 ? 'critical' : marginDrop > 15 ? 'high' : 'medium',
          detectedAt: new Date(),
          affectedId: sku.id,
          affectedName: sku.name || sku.code,
          details: {
            metric: 'Margin',
            currentValue: currentMarginPercent,
            expectedValue: previousMarginPercent,
            deviationPercent: marginDrop,
            threshold: config.marginThreshold,
          },
          recommendation: `Margin for ${sku.name || sku.code} dropped ${marginDrop.toFixed(1)}% to ${currentMarginPercent.toFixed(1)}%. Consider price adjustment to maintain profitability.`,
        })
      }
    }
  }

  return anomalies
}

/**
 * Calculate statistical outliers using Z-score method
 */
export function detectStatisticalOutliers(
  values: number[],
  threshold: number = 2.0
): { outliers: number[]; indices: number[] } {
  if (values.length < 3) return { outliers: [], indices: [] }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  const outliers: number[] = []
  const indices: number[] = []

  values.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev)
    if (zScore > threshold) {
      outliers.push(value)
      indices.push(index)
    }
  })

  return { outliers, indices }
}
