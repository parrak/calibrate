'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Memory, 
  TrendingUp, 
  TrendingDown,
  RefreshCw
} from 'lucide-react'

interface PerformanceData {
  timestamp: string
  timeRange: string
  responseTime: string
  healthScore: number
  overview: {
    healthScore: number
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    throughput: number
  }
  performance: {
    responseTimes: {
      average: number
      p50: number
      p95: number
      p99: number
    }
    slowestEndpoints: Array<{
      endpoint: string
      averageTime: number
      requestCount: number
    }>
    errorBreakdown: Array<{
      errorType: string
      count: number
      percentage: number
    }>
  }
  resources: {
    memory: {
      current: {
        used: number
        total: number
        external: number
        rss: number
      } | null
      trend: {
        direction: string
        change: number
      }
      usage: {
        used: number
        total: number
        percentage: number
      }
    }
    cpu: {
      current: {
        loadAverage: number[]
      } | null
      trend: {
        direction: string
        change: number
      }
      load: {
        load1: number
        load5: number
        load15: number
      }
    }
    database: {
      slowQueries: any[]
      connectionStats: any
      queryStats: any
      trend: {
        direction: string
        change: number
      }
    }
  }
  trends: {
    memory: { direction: string; change: number }
    cpu: { direction: string; change: number }
    database: { direction: string; change: number }
  }
  insights: string[]
  alerts: Array<{
    type: string
    message: string
    severity: string
  }>
  charts: {
    responseTimeOverTime: Array<{ timestamp: number; value: number }>
    throughputOverTime: Array<{ timestamp: number; value: number }>
    errorRateOverTime: Array<{ timestamp: number; value: number }>
    resourceUsageOverTime: Array<{
      timestamp: number
      memory: number
      cpu: number
    }>
  }
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/performance?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-600">Error: {error}</span>
        <Button onClick={fetchData} className="ml-4" size="sm">
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time system performance monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <Button onClick={fetchData} size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-4xl font-bold ${getHealthScoreColor(data.overview.healthScore)}`}>
                {data.overview.healthScore}
              </div>
              <div className="text-sm text-gray-600">Health Score</div>
            </div>
            <Badge className={getHealthScoreBadge(data.overview.healthScore)}>
              {data.overview.healthScore >= 90 ? 'Excellent' : 
               data.overview.healthScore >= 70 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{data.overview.totalRequests.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{data.overview.averageResponseTime}ms</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{data.overview.errorRate}%</div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">{data.overview.throughput}</div>
                <div className="text-sm text-gray-600">Requests/sec</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Times */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Average</span>
                <span className="font-mono">{data.performance.responseTimes.average}ms</span>
              </div>
              <div className="flex justify-between">
                <span>P50 (Median)</span>
                <span className="font-mono">{data.performance.responseTimes.p50}ms</span>
              </div>
              <div className="flex justify-between">
                <span>P95</span>
                <span className="font-mono">{data.performance.responseTimes.p95}ms</span>
              </div>
              <div className="flex justify-between">
                <span>P99</span>
                <span className="font-mono">{data.performance.responseTimes.p99}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Memory</span>
                  <span className="font-mono">
                    {data.resources.memory.usage.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${data.resources.memory.usage.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{Math.round(data.resources.memory.usage.used / 1024 / 1024)}MB</span>
                  <span>{Math.round(data.resources.memory.usage.total / 1024 / 1024)}MB</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>CPU Load</span>
                  <span className="font-mono">{data.resources.cpu.load.load1.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(data.trends.cpu.direction)}
                  <span className="text-sm text-gray-600">
                    {data.trends.cpu.direction} ({data.trends.cpu.change > 0 ? '+' : ''}{data.trends.cpu.change.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="ml-3">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.map((insight, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slowest Endpoints */}
      {data.performance.slowestEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slowest Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.performance.slowestEndpoints.map((endpoint, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{endpoint.endpoint}</span>
                  <div className="text-right">
                    <div className="font-mono">{endpoint.averageTime}ms</div>
                    <div className="text-xs text-gray-600">{endpoint.requestCount} requests</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
