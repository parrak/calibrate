/**
 * Performance Monitoring Service
 * Centralized service for performance tracking and alerting
 */

import { randomUUID } from 'crypto'
import {
  getPerformanceStats,
  getResourceStats,
  getDatabasePerformanceMetrics
} from './performance-monitor'

export interface PerformanceAlert {
  id: string
  type: 'error_rate' | 'response_time' | 'memory' | 'cpu' | 'database'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  resolved: boolean
  metadata?: Record<string, unknown>
}

export interface PerformanceThresholds {
  errorRate: number // percentage
  responseTimeP95: number // milliseconds
  memoryUsage: number // percentage
  cpuLoad: number // load average
  databaseConnections: number
}

export class PerformanceService {
  private static instance: PerformanceService
  private alerts: Map<string, PerformanceAlert> = new Map()
  private thresholds: PerformanceThresholds = {
    errorRate: 5.0,
    responseTimeP95: 2000,
    memoryUsage: 85,
    cpuLoad: 2.0,
    databaseConnections: 50
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  /**
   * Check performance metrics and generate alerts
   */
  async checkPerformance(timeRangeMs: number = 60 * 60 * 1000): Promise<PerformanceAlert[]> {
    const newAlerts: PerformanceAlert[] = []

    try {
      const [performanceStats, resourceStats, databaseMetrics] = await Promise.all([
        getPerformanceStats(timeRangeMs),
        getResourceStats(timeRangeMs),
        getDatabasePerformanceMetrics()
      ])

      // Check error rate
      if (performanceStats.errorRate > this.thresholds.errorRate) {
        // Check if we already have an active error rate alert
        const existingAlert = Array.from(this.alerts.values())
          .find(alert => alert.type === 'error_rate' && !alert.resolved)

        if (!existingAlert) {
          const alert = this.createAlert('error_rate', 'high',
            `Error rate is ${performanceStats.errorRate.toFixed(2)}%, exceeding threshold of ${this.thresholds.errorRate}%`,
            { errorRate: performanceStats.errorRate, threshold: this.thresholds.errorRate }
          )
          newAlerts.push(alert)
        }
      }

      // Check response time
      if (performanceStats.p95ResponseTime > this.thresholds.responseTimeP95) {
        const alert = this.createAlert('response_time', 'high',
          `P95 response time is ${Math.round(performanceStats.p95ResponseTime)}ms, exceeding threshold of ${this.thresholds.responseTimeP95}ms`,
          { p95ResponseTime: performanceStats.p95ResponseTime, threshold: this.thresholds.responseTimeP95 }
        )
        newAlerts.push(alert)
      }

      // Check memory usage
      const latestResource = resourceStats[resourceStats.length - 1]
      if (latestResource) {
        const memoryUsagePercent = (latestResource.memory.used / latestResource.memory.total) * 100
        if (memoryUsagePercent > this.thresholds.memoryUsage) {
          const alert = this.createAlert('memory', 'medium',
            `Memory usage is ${Math.round(memoryUsagePercent)}%, exceeding threshold of ${this.thresholds.memoryUsage}%`,
            { memoryUsage: memoryUsagePercent, threshold: this.thresholds.memoryUsage }
          )
          newAlerts.push(alert)
        }
      }

      // Check CPU load
      if (latestResource && latestResource.cpu.loadAverage[0] > this.thresholds.cpuLoad) {
        const alert = this.createAlert('cpu', 'medium',
          `CPU load is ${latestResource.cpu.loadAverage[0].toFixed(2)}, exceeding threshold of ${this.thresholds.cpuLoad}`,
          { cpuLoad: latestResource.cpu.loadAverage[0], threshold: this.thresholds.cpuLoad }
        )
        newAlerts.push(alert)
      }

      // Check database connections
      if (databaseMetrics.connectionStats) {
        const activeConnections = Number(databaseMetrics.connectionStats.active_connections) || 0
        if (activeConnections > this.thresholds.databaseConnections) {
          const alert = this.createAlert('database', 'medium',
            `Database has ${activeConnections} active connections, exceeding threshold of ${this.thresholds.databaseConnections}`,
            { activeConnections, threshold: this.thresholds.databaseConnections }
          )
          newAlerts.push(alert)
        }
      }

      // Store new alerts
      newAlerts.forEach(alert => {
        this.alerts.set(alert.id, alert)
      })

    } catch (error) {
      console.error('Performance check failed:', error)
    }

    return newAlerts
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: string): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.type === type)
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      return true
    }
    return false
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(timeRangeMs: number = 60 * 60 * 1000) {
    const [performanceStats, resourceStats, databaseMetrics] = await Promise.all([
      getPerformanceStats(timeRangeMs),
      getResourceStats(timeRangeMs),
      getDatabasePerformanceMetrics()
    ])

    // Convert resourceStats to the format expected by calculateHealthScore
    const resourceStatsForHealth = resourceStats.map(stat => ({
      memory: stat.memory,
      cpu: stat.cpu
    }))

    const healthScore = this.calculateHealthScore(performanceStats, resourceStatsForHealth)
    const activeAlerts = this.getActiveAlerts()

    return {
      healthScore,
      performance: performanceStats,
      resources: resourceStats,
      database: databaseMetrics,
      alerts: activeAlerts,
      thresholds: this.thresholds
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(timeRangeMs: number = 24 * 60 * 60 * 1000) {
    const summary = await this.getPerformanceSummary(timeRangeMs)

    return {
      ...summary,
      report: {
        generatedAt: new Date().toISOString(),
        timeRange: timeRangeMs,
        totalRequests: summary.performance.totalRequests,
        averageResponseTime: summary.performance.averageResponseTime,
        errorRate: summary.performance.errorRate,
        throughput: summary.performance.throughput,
        slowestEndpoints: summary.performance.slowestEndpoints,
        errorBreakdown: summary.performance.errorBreakdown,
        recommendations: this.generateRecommendations(summary)
      }
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metadata?: Record<string, unknown>
  ): PerformanceAlert {
    return {
      id: `${type}_${Date.now()}_${randomUUID()}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false,
      metadata
    }
  }

  private calculateHealthScore(performanceStats: { errorRate: number; p95ResponseTime: number }, resourceStats: Array<{ memory?: { used: number; total: number }; cpu?: { loadAverage: [number, number, number] } }>): number {
    let score = 100

    // Deduct points for high error rate
    if (performanceStats.errorRate > 5) score -= 25
    else if (performanceStats.errorRate > 1) score -= 15

    // Deduct points for slow response times
    if (performanceStats.p95ResponseTime > 2000) score -= 25
    else if (performanceStats.p95ResponseTime > 1000) score -= 15

    // Deduct points for high memory usage
    const latestMemory = resourceStats[resourceStats.length - 1]?.memory
    if (latestMemory) {
      const memoryUsagePercent = (latestMemory.used / latestMemory.total) * 100
      if (memoryUsagePercent > 90) score -= 20
      else if (memoryUsagePercent > 80) score -= 10
    }

    // Deduct points for high CPU load
    const latestCpu = resourceStats[resourceStats.length - 1]?.cpu
    if (latestCpu && latestCpu.loadAverage[0] > 2) {
      score -= 15
    }

    return Math.max(0, score)
  }

  private generateRecommendations(summary: { performance: { p95ResponseTime: number; errorRate: number; throughput?: number }; resources: Array<{ memory?: { used: number; total: number } }>; alerts: Array<unknown> }): string[] {
    const recommendations: string[] = []

    if (summary.performance.p95ResponseTime > 1000) {
      recommendations.push('Consider optimizing slow endpoints or adding caching')
    }

    if (summary.performance.errorRate > 1) {
      recommendations.push('Investigate and fix error sources')
    }

    const latestMemory = summary.resources[summary.resources.length - 1]?.memory
    if (latestMemory) {
      const memoryUsagePercent = (latestMemory.used / latestMemory.total) * 100
      if (memoryUsagePercent > 80) {
        recommendations.push('Monitor memory usage and consider memory optimization')
      }
    }

    if (summary.performance.throughput && summary.performance.throughput > 1000) {
      recommendations.push('Consider horizontal scaling for high traffic')
    }

    if (summary.alerts.length > 0) {
      recommendations.push('Address active performance alerts')
    }

    return recommendations
  }
}

// Export singleton instance
export const performanceService = PerformanceService.getInstance()
