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
              <h2 className="text-xl font-semibold mb-4">Recent Products</h2>
              <div className="space-y-3">
                {data.topPerformers.bySales.slice(0, 5).map((item: SkuPerformance) => (
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
                      <div className="font-semibold">
                        ${(item.price / 100).toFixed(2)}
                      </div>
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
}: {
  trend: { current: number; previous: number; direction: string }
}) {
  const max = Math.max(trend.current, trend.previous)
  const currentHeight = (trend.current / max) * 100
  const previousHeight = (trend.previous / max) * 100

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
        <div className="font-semibold">{trend.previous}</div>
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
        <div className="font-semibold">{trend.current}</div>
      </div>
    </div>
  )
}
