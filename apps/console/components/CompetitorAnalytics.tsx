'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/components/Card'
import { Badge } from '../lib/components/Badge'
import { TrendingDown, TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react'

interface PriceComparison {
  skuId: string
  skuName: string
  ourPrice: number
  competitorPrices: {
    competitorId: string
    competitorName: string
    price: number
    currency: string
    isOnSale: boolean
  }[]
}

interface MarketInsights {
  minPrice: number
  maxPrice: number
  avgPrice: number
  ourPosition: 'lowest' | 'highest' | 'middle'
  priceSpread: number
  competitorCount: number
}

export function CompetitorAnalytics({ tenantId, projectId }: { tenantId: string; projectId: string }) {
  const [comparisons, setComparisons] = useState<PriceComparison[]>([])
  const [insights, setInsights] = useState<MarketInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [tenantId, projectId])

  const fetchAnalytics = async () => {
    try {
      // TODO: Implement API endpoint for price comparisons
      // For now, using mock data
      const mockComparisons: PriceComparison[] = [
        {
          skuId: 'sku1',
          skuName: 'Professional Plan - Monthly',
          ourPrice: 4900,
          competitorPrices: [
            { competitorId: '1', competitorName: 'Competitor A', price: 5900, currency: 'USD', isOnSale: false },
            { competitorId: '2', competitorName: 'Competitor B', price: 4700, currency: 'USD', isOnSale: true },
          ]
        },
        {
          skuId: 'sku2',
          skuName: 'Enterprise Plan - Monthly',
          ourPrice: 12900,
          competitorPrices: [
            { competitorId: '1', competitorName: 'Competitor A', price: 14900, currency: 'USD', isOnSale: false },
            { competitorId: '2', competitorName: 'Competitor B', price: 11900, currency: 'USD', isOnSale: false },
          ]
        }
      ]

      setComparisons(mockComparisons)

      // Calculate insights from comparisons
      if (mockComparisons.length > 0) {
        const allPrices = mockComparisons.flatMap(c => [
          c.ourPrice,
          ...c.competitorPrices.map(cp => cp.price)
        ])

        const minPrice = Math.min(...allPrices)
        const maxPrice = Math.max(...allPrices)
        const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
        const ourAvgPrice = mockComparisons.reduce((sum, c) => sum + c.ourPrice, 0) / mockComparisons.length

        let ourPosition: 'lowest' | 'highest' | 'middle' = 'middle'
        if (ourAvgPrice <= minPrice * 1.05) ourPosition = 'lowest'
        else if (ourAvgPrice >= maxPrice * 0.95) ourPosition = 'highest'

        setInsights({
          minPrice,
          maxPrice,
          avgPrice,
          ourPosition,
          priceSpread: maxPrice - minPrice,
          competitorCount: mockComparisons[0]?.competitorPrices.length || 0
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'lowest': return 'text-green-600 bg-green-50'
      case 'highest': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'lowest': return <TrendingDown className="h-5 w-5" />
      case 'highest': return <TrendingUp className="h-5 w-5" />
      default: return <Target className="h-5 w-5" />
    }
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Competitive Analytics</h2>
        <p className="text-gray-600 mt-1">
          Market position and price comparison insights
        </p>
      </div>

      {/* Market Insights Overview */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Position</CardTitle>
              {getPositionIcon(insights.ourPosition)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{insights.ourPosition}</div>
              <p className="text-xs text-gray-600 mt-1">
                Compared to {insights.competitorCount} competitors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Market Price</CardTitle>
              <DollarSign className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(insights.avgPrice)}</div>
              <p className="text-xs text-gray-600 mt-1">
                Spread: {formatPrice(insights.priceSpread)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
              <TrendingDown className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(insights.minPrice)}</div>
              <p className="text-xs text-gray-600 mt-1">Market floor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
              <TrendingUp className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(insights.maxPrice)}</div>
              <p className="text-xs text-gray-600 mt-1">Market ceiling</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Price Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle>Price Comparisons</CardTitle>
          <CardDescription>
            Compare your prices against competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {comparisons.map((comparison) => {
              const allPrices = [comparison.ourPrice, ...comparison.competitorPrices.map(cp => cp.price)]
              const minPrice = Math.min(...allPrices)
              const isLowest = comparison.ourPrice === minPrice

              return (
                <div key={comparison.skuId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{comparison.skuName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(comparison.ourPrice)}
                        </span>
                        {isLowest && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Lowest
                          </Badge>
                        )}
                        {!isLowest && comparison.ourPrice > minPrice && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            ${((comparison.ourPrice - minPrice) / 100).toFixed(2)} higher
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Competitor Prices</p>
                    {comparison.competitorPrices.map((cp) => (
                      <div key={cp.competitorId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{cp.competitorName}</span>
                          {cp.isOnSale && (
                            <Badge variant="destructive" className="text-xs">Sale</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(cp.price, cp.currency)}
                          </span>
                          {cp.price < comparison.ourPrice && (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
