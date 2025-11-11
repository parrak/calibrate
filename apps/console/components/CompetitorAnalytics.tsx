'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/components/Card'
import { Badge } from '../lib/components/Badge'
import { Button } from '../lib/components/Button'
import { TrendingDown, TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react'
import { competitorsApi, ApiError } from '@/lib/api-client'

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

export function CompetitorAnalytics({ tenantId: _tenantId, projectId }: { tenantId: string; projectId: string }) {
  const { data: session } = useSession()
  const token = (session as { apiToken?: string })?.apiToken

  const [comparisons, setComparisons] = useState<PriceComparison[]>([])
  const [insights, setInsights] = useState<MarketInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [projectId, token])

  const fetchAnalytics = async () => {
    try {
      setError(null)
      setIsAuthError(false)

      // Use projectId as projectSlug (they are the same in this context)
      const data = await competitorsApi.getAnalytics(projectId, token)
      setComparisons(data.comparisons)
      setInsights(data.insights)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      if (error instanceof ApiError && error.status === 401) {
        setError('Authentication failed. Please sign out and sign in again to refresh your session.')
        setIsAuthError(true)
      } else {
        setError('Failed to load analytics data')
        setIsAuthError(false)
      }
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

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'lowest': return <TrendingDown className="h-5 w-5" />
      case 'highest': return <TrendingUp className="h-5 w-5" />
      default: return <Target className="h-5 w-5" />
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-2">{error}</p>
            {isAuthError && (
              <p className="text-sm text-gray-600 mb-4">
                This usually means your authentication token has expired or is invalid.
              </p>
            )}
            <div className="flex gap-2 justify-center">
              {isAuthError ? (
                <>
                  <Button onClick={handleSignOut} className="mt-4" variant="primary">
                    Sign Out
                  </Button>
                  <Button onClick={fetchAnalytics} className="mt-4" variant="outline">
                    Retry
                  </Button>
                </>
              ) : (
                <Button onClick={fetchAnalytics} className="mt-4" variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (comparisons.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Available</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add competitors and track their products to see competitive analytics and market insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
