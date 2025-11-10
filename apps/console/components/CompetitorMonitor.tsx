'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/components/Card'
import { Button } from '../lib/components/Button'
import { Badge } from '../lib/components/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/components/Table'
import { AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import { competitorsApi, ApiError } from '@/lib/api-client'

interface Competitor {
  id: string
  name: string
  domain: string
  channel: string
  isActive: boolean
  lastChecked?: string
  products: Array<{
    id: string
    name: string
    skuCode?: string
    url: string
    prices: Array<{
      amount: number
      currency: string
      isOnSale: boolean
      createdAt: string
    }>
  }>
}

interface MonitoringResult {
  success: boolean
  competitorId: string
  productsChecked: number
  pricesUpdated: number
  errors: string[]
  duration: number
}

export function CompetitorMonitor({ projectSlug }: { projectSlug: string }) {
  const { data: session } = useSession()
  const token = (session as { apiToken?: string })?.apiToken

  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [monitoringResults, setMonitoringResults] = useState<MonitoringResult[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)

  useEffect(() => {
    fetchCompetitors()
  }, [projectSlug, token])

  const fetchCompetitors = async () => {
    try {
      setError(null)
      setIsAuthError(false)
      const data = await competitorsApi.list(projectSlug, token)
      setCompetitors(Array.isArray(data) ? (data as unknown as Competitor[]) : [])
    } catch (error) {
      console.error('Error fetching competitors:', error)
      if (error instanceof ApiError && error.status === 401) {
        setError('Authentication failed. Please sign out and sign in again to refresh your session.')
        setIsAuthError(true)
      } else {
        setError('Failed to load competitors')
        setIsAuthError(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = async () => {
    setIsMonitoring(true)
    setError(null)
    setIsAuthError(false)
    try {
      // Monitor all competitors in the project using projectSlug
      const result = await competitorsApi.monitor('', projectSlug, token)
      const results = (result.results || []) as unknown as MonitoringResult[]
      setMonitoringResults(results)
      await fetchCompetitors() // Refresh data
    } catch (error) {
      console.error('Error monitoring competitors:', error)
      if (error instanceof ApiError && error.status === 401) {
        setError('Authentication failed. Please sign out and sign in again to refresh your session.')
        setIsAuthError(true)
      } else {
        setError('Failed to start monitoring')
        setIsAuthError(false)
      }
    } finally {
      setIsMonitoring(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return <div>Loading competitors...</div>
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
                  <Button onClick={handleSignOut} className="mt-4" variant="default">
                    Sign Out
                  </Button>
                  <Button onClick={fetchCompetitors} className="mt-4" variant="outline">
                    Retry
                  </Button>
                </>
              ) : (
                <Button onClick={fetchCompetitors} className="mt-4" variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competitor Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Monitor competitor prices and track market positioning
          </p>
        </div>
        <Button
          onClick={startMonitoring}
          disabled={isMonitoring}
          className="flex items-center gap-2"
        >
          {isMonitoring ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Monitoring...
            </>
          ) : (
            'Start Monitoring'
          )}
        </Button>
      </div>

      {/* Monitoring Results */}
      {monitoringResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Monitoring Results</CardTitle>
            <CardDescription>
              Results from the most recent monitoring run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monitoringResults.map((result) => {
                const competitor = competitors.find(c => c.id === result.competitorId)
                return (
                  <div key={result.competitorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{competitor?.name || 'Unknown Competitor'}</div>
                        <div className="text-sm text-gray-600">
                          {result.productsChecked} products checked, {result.pricesUpdated} prices updated
                        </div>
                        {result.errors.length > 0 && (
                          <div className="text-sm text-red-600">
                            {result.errors.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDuration(result.duration)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitors List */}
      <Card>
        <CardHeader>
          <CardTitle>Competitors ({competitors.length})</CardTitle>
          <CardDescription>
            Track competitor prices and market positioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No competitors configured. Add competitors to start monitoring.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="text-gray-900">{competitor.name}</div>
                        <div className="text-sm text-gray-600">{competitor.domain}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{competitor.channel}</Badge>
                    </TableCell>
                    <TableCell>{competitor.products.length}</TableCell>
                    <TableCell>
                      {competitor.lastChecked
                        ? new Date(competitor.lastChecked).toLocaleString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={competitor.isActive ? 'default' : 'secondary'}>
                        {competitor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Price Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Price Updates</CardTitle>
          <CardDescription>
            Latest price changes from competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitors.flatMap(competitor =>
              competitor.products.map(product =>
                product.prices.map((price, index) => (
                  <div key={`${product.id}-${index}`} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        {competitor.name} • {product.skuCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatPrice(price.amount, price.currency)}
                        {price.isOnSale && (
                          <Badge variant="destructive" className="ml-2">Sale</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(price.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )
            ).slice(0, 10)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
