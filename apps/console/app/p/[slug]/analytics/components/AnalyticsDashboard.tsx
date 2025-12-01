'use client'

import { useEffect, useState } from 'react'
import type { AnalyticsOverview, SkuPerformance } from '@calibr/analytics'

interface Props {
  projectSlug: string
}

export function AnalyticsDashboard({ projectSlug }: Props) {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [projectSlug, days])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)

    try {
      // Use API base URL from environment
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'
      const response = await fetch(
        `${apiBase}/api/v1/analytics/${projectSlug}?days=${days}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to fetch analytics')
      }

      const analytics = await response.json()
      setData(analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Error loading analytics</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12">No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {d} Days
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total SKUs"
          value={data.summary.totalSkus.toLocaleString()}
          trend={null}
        />
        <MetricCard
          title="Price Changes"
          value={data.summary.totalPriceChanges.toLocaleString()}
          subtitle={`${data.summary.averageChangePerDay.toFixed(1)}/day avg`}
          trend={data.trends.priceChanges}
        />
        <MetricCard
          title="Approval Rate"
          value={`${(data.summary.approvalRate * 100).toFixed(0)}%`}
          trend={null}
        />
        <MetricCard
          title="Avg Price"
          value={`$${(data.trends.averagePrice.current / 100).toFixed(2)}`}
          trend={data.trends.averagePrice}
        />
      </div>

      {/* Price Changes Trend */}
      {data.trends.priceChanges && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Price Changes Trend</h2>
          <TrendChart trend={data.trends.priceChanges} />
        </div>
      )}

      {/* Revenue Trend (if sales data available) */}
      {data.trends.revenue && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
          <TrendChart trend={data.trends.revenue} valuePrefix="$" valueFormatter={(v) => (v / 100).toFixed(2)} />
        </div>
      )}

      {/* Price Change Frequency */}
      {data.snapshots && data.snapshots.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Price Change Frequency (Last {days} Days)</h2>
          <PriceChangeFrequencyChart snapshots={data.snapshots} />
        </div>
      )}

      {/* Margin Distribution (if margin data available) */}
      {data.snapshots && data.snapshots.some(s => s.margins) && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Margin Trend</h2>
          <MarginChart snapshots={data.snapshots} />
        </div>
      )}

      {/* Competitor Insights (if competitor data available) */}
      {data.snapshots && data.snapshots.some(s => s.competitorInsights) && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Competitive Position</h2>
          <CompetitorInsightsChart snapshots={data.snapshots} />
        </div>
      )}

      {/* Top Performers */}
      {data.topPerformers && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.topPerformers.byMargin && data.topPerformers.byMargin.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Top Margins</h2>
              <div className="space-y-3">
                {data.topPerformers.byMargin.slice(0, 5).map((item: SkuPerformance) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{item.sku}</div>
                      {item.name && (
                        <div className="text-sm text-gray-500">{item.name}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {item.margin?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        ${(item.price / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.topPerformers.bySales && data.topPerformers.bySales.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Top SKUs by Sales</h2>
              <div className="space-y-3">
                {data.topPerformers.bySales
                  .filter((item: SkuPerformance) => item.revenue && item.revenue > 0)
                  .slice(0, 5)
                  .map((item: SkuPerformance) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{item.sku}</div>
                        {item.name && (
                          <div className="text-sm text-gray-500">{item.name}</div>
                        )}
                      </div>
                      <div className="text-right">
                        {item.revenue && (
                          <div className="font-semibold text-blue-600">
                            ${(item.revenue / 100).toLocaleString()}
                          </div>
                        )}
                        {item.units && (
                          <div className="text-xs text-gray-500">
                            {item.units} units
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: { direction: 'up' | 'down' | 'stable'; changePercent: number } | null
}

function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.direction === 'up' && (
            <span className="text-green-600 text-sm">↑ {trend.changePercent}%</span>
          )}
          {trend.direction === 'down' && (
            <span className="text-red-600 text-sm">↓ {Math.abs(trend.changePercent)}%</span>
          )}
          {trend.direction === 'stable' && (
            <span className="text-gray-600 text-sm">→ Stable</span>
          )}
        </div>
      )}
    </div>
  )
}

function TrendChart({
  trend,
  valuePrefix = '',
  valueFormatter = (v: number) => v.toString(),
}: {
  trend: { current: number; previous: number; direction: string }
  valuePrefix?: string
  valueFormatter?: (v: number) => string
}) {
  const max = Math.max(trend.current, trend.previous)
  const currentHeight = max > 0 ? (trend.current / max) * 100 : 0
  const previousHeight = max > 0 ? (trend.previous / max) * 100 : 0

  return (
    <div className="flex items-end gap-8 h-32">
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex items-end justify-center h-full">
          <div
            className="w-24 bg-gray-300 rounded-t"
            style={{ height: `${previousHeight}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Previous</div>
        <div className="font-semibold">{valuePrefix}{valueFormatter(trend.previous)}</div>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex items-end justify-center h-full">
          <div
            className={`w-24 rounded-t ${
              trend.direction === 'up'
                ? 'bg-green-500'
                : trend.direction === 'down'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            }`}
            style={{ height: `${currentHeight}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Current</div>
        <div className="font-semibold">{valuePrefix}{valueFormatter(trend.current)}</div>
      </div>
    </div>
  )
}

function PriceChangeFrequencyChart({ snapshots }: { snapshots: any[] }) {
  if (snapshots.length === 0) return null

  const maxChanges = Math.max(...snapshots.map(s => s.priceChanges.total))

  return (
    <div className="space-y-2">
      {snapshots.map((snapshot, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="text-xs text-gray-500 w-20">
            {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{
                width: maxChanges > 0 ? `${(snapshot.priceChanges.total / maxChanges) * 100}%` : '0%'
              }}
            />
          </div>
          <div className="text-sm font-medium w-12 text-right">
            {snapshot.priceChanges.total}
          </div>
        </div>
      ))}
    </div>
  )
}

function MarginChart({ snapshots }: { snapshots: any[] }) {
  const snapshotsWithMargins = snapshots.filter(s => s.margins)
  if (snapshotsWithMargins.length === 0) return null

  const maxMargin = Math.max(...snapshotsWithMargins.map(s => s.margins.averageMargin))
  const minMarginValue = Math.min(...snapshotsWithMargins.map(s => s.margins.averageMargin))

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Min: {minMarginValue.toFixed(1)}%</span>
        <span>Max: {maxMargin.toFixed(1)}%</span>
      </div>
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-around gap-1">
          {snapshotsWithMargins.map((snapshot, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t"
                style={{
                  height: `${(snapshot.margins.averageMargin / maxMargin) * 100}%`
                }}
                title={`${snapshot.margins.averageMargin.toFixed(1)}%`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center">
        Average Margin Over Time
      </div>
    </div>
  )
}

function CompetitorInsightsChart({ snapshots }: { snapshots: any[] }) {
  const snapshotsWithCompetitors = snapshots.filter(s => s.competitorInsights)
  if (snapshotsWithCompetitors.length === 0) return null

  const latestSnapshot = snapshotsWithCompetitors[snapshotsWithCompetitors.length - 1]
  const { competitorInsights } = latestSnapshot

  const total = competitorInsights.pricesBelowMarket + competitorInsights.pricesAboveMarket
  const belowPercentage = total > 0 ? (competitorInsights.pricesBelowMarket / total) * 100 : 0
  const abovePercentage = total > 0 ? (competitorInsights.pricesAboveMarket / total) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Sampled Products</div>
          <div className="text-2xl font-bold text-blue-600">
            {competitorInsights.totalCompetitorsSampled}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Avg Price Delta</div>
          <div className="text-2xl font-bold text-purple-600">
            ${(competitorInsights.averageCompetitiveDelta / 100).toFixed(2)}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600">Below Market: {competitorInsights.pricesBelowMarket}</span>
          <span className="text-red-600">Above Market: {competitorInsights.pricesAboveMarket}</span>
        </div>
        <div className="h-8 flex rounded-full overflow-hidden">
          <div
            className="bg-green-500"
            style={{ width: `${belowPercentage}%` }}
            title={`${belowPercentage.toFixed(1)}% below market`}
          />
          <div
            className="bg-red-500"
            style={{ width: `${abovePercentage}%` }}
            title={`${abovePercentage.toFixed(1)}% above market`}
          />
        </div>
      </div>
    </div>
  )
}
