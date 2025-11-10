import { NextResponse } from 'next/server'

/**
 * Performance Dashboard API
 *
 * Returns system performance metrics for monitoring
 * TODO: Implement real performance tracking
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'

    // Mock data for now - replace with real metrics later
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      responseTime: '120ms',
      healthScore: 95,
      overview: {
        healthScore: 95,
        totalRequests: 12543,
        averageResponseTime: 120,
        errorRate: 0.5,
        throughput: 42,
      },
      performance: {
        responseTimes: {
          average: 120,
          p50: 95,
          p95: 280,
          p99: 450,
        },
        slowestEndpoints: [
          {
            endpoint: '/api/v1/catalog',
            averageTime: 350,
            requestCount: 2341,
          },
          {
            endpoint: '/api/v1/price-changes',
            averageTime: 280,
            requestCount: 1876,
          },
          {
            endpoint: '/api/platforms/shopify/sync',
            averageTime: 245,
            requestCount: 543,
          },
        ],
        errorBreakdown: [
          {
            errorType: '404 Not Found',
            count: 23,
            percentage: 45,
          },
          {
            errorType: '500 Internal Server Error',
            count: 15,
            percentage: 30,
          },
          {
            errorType: '401 Unauthorized',
            count: 13,
            percentage: 25,
          },
        ],
      },
      resources: {
        memory: {
          current: {
            used: 512000000,
            total: 2048000000,
            external: 45000000,
            rss: 567000000,
          },
          trend: {
            direction: 'stable',
            change: 0.5,
          },
          usage: {
            used: 512000000,
            total: 2048000000,
            percentage: 25,
          },
        },
        cpu: {
          current: {
            loadAverage: [0.45, 0.52, 0.48],
          },
          trend: {
            direction: 'stable',
            change: 0.02,
          },
          load: {
            load1: 0.45,
            load5: 0.52,
            load15: 0.48,
          },
        },
        database: {
          slowQueries: [],
          connectionStats: {},
          queryStats: {},
          trend: {
            direction: 'stable',
            change: 0,
          },
        },
      },
      trends: {
        memory: { direction: 'stable', change: 0.5 },
        cpu: { direction: 'stable', change: 0.02 },
        database: { direction: 'stable', change: 0 },
      },
      insights: [
        'System performance is healthy with no critical issues',
        'Average response time is within acceptable limits',
        'Error rate is below 1%, meeting SLA requirements',
      ],
      alerts: [],
      charts: {
        responseTimeOverTime: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          value: 100 + Math.random() * 50,
        })),
        throughputOverTime: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          value: 35 + Math.random() * 15,
        })),
        errorRateOverTime: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          value: Math.random() * 2,
        })),
        resourceUsageOverTime: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          memory: 20 + Math.random() * 15,
          cpu: 40 + Math.random() * 20,
        })),
      },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
