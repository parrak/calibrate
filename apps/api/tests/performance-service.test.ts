import { describe, it, expect, beforeEach, vi } from 'vitest'
import { performanceService, PerformanceService } from '../lib/performance-service'

// Mock the performance-monitor module
vi.mock('../lib/performance-monitor', () => ({
  getPerformanceStats: vi.fn().mockResolvedValue({
    totalRequests: 100,
    averageResponseTime: 500,
    p95ResponseTime: 1000,
    p99ResponseTime: 2000,
    errorRate: 2.5,
    throughput: 10,
    slowestEndpoints: [],
    errorBreakdown: {}
  }),
  getResourceStats: vi.fn().mockResolvedValue([
    {
      timestamp: Date.now(),
      memory: { used: 100000000, total: 200000000 },
      cpu: { loadAverage: [1.5, 1.2, 1.0] },
      database: { connections: 10, activeQueries: 2, slowQueries: 0 },
      uptime: 3600
    }
  ]),
  getDatabasePerformanceMetrics: vi.fn().mockResolvedValue({
    connectionStats: { active_connections: 10, total_connections: 20 },
    slowQueries: [],
    queryPerformance: []
  }),
  getAllPerformanceMetrics: vi.fn().mockReturnValue(new Map()),
  getAllErrorMetrics: vi.fn().mockReturnValue(new Map())
}))

describe('Performance Service', () => {
  let service: PerformanceService

  beforeEach(() => {
    // Get a fresh instance for each test
    service = PerformanceService.getInstance()
    // Clear any existing alerts
    service['alerts'].clear()
  })

  describe('Alert Generation', () => {
    it('should generate unique alert IDs', () => {
      const alert1 = service['createAlert']('error_rate', 'high', 'Test alert 1')
      const alert2 = service['createAlert']('error_rate', 'high', 'Test alert 2')
      
      expect(alert1.id).not.toBe(alert2.id)
      expect(alert1.id).toMatch(/^error_rate_\d+_[a-f0-9-]{36}$/)
      expect(alert2.id).toMatch(/^error_rate_\d+_[a-f0-9-]{36}$/)
    })

    it('should generate alert IDs with correct format', () => {
      const alert = service['createAlert']('memory', 'critical', 'Memory alert')
      
      expect(alert.id).toMatch(/^memory_\d+_[a-f0-9-]{36}$/)
      expect(alert.type).toBe('memory')
      expect(alert.severity).toBe('critical')
      expect(alert.message).toBe('Memory alert')
      expect(alert.resolved).toBe(false)
      expect(alert.timestamp).toBeGreaterThan(0)
    })

    it('should not generate duplicate alert IDs even with rapid creation', async () => {
      const alerts = []
      
      // Create multiple alerts rapidly
      for (let i = 0; i < 100; i++) {
        const alert = service['createAlert']('error_rate', 'high', `Alert ${i}`)
        alerts.push(alert)
      }
      
      // Check for duplicates
      const ids = alerts.map(alert => alert.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('Performance Checking', () => {
    it('should create alerts when thresholds are exceeded', async () => {
      // Mock high error rate
      vi.mocked(require('../lib/performance-monitor').getPerformanceStats)
        .mockResolvedValueOnce({
          totalRequests: 100,
          averageResponseTime: 500,
          p95ResponseTime: 1000,
          p99ResponseTime: 2000,
          errorRate: 10, // Above threshold of 5
          throughput: 10,
          slowestEndpoints: [],
          errorBreakdown: {}
        })

      const alerts = await service.checkPerformance()
      
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('error_rate')
      expect(alerts[0].severity).toBe('high')
      expect(alerts[0].message).toContain('10.00%')
    })

    it('should not create duplicate alerts for same issue', async () => {
      // Mock high error rate
      vi.mocked(require('../lib/performance-monitor').getPerformanceStats)
        .mockResolvedValue({
          totalRequests: 100,
          averageResponseTime: 500,
          p95ResponseTime: 1000,
          p99ResponseTime: 2000,
          errorRate: 10, // Above threshold
          throughput: 10,
          slowestEndpoints: [],
          errorBreakdown: {}
        })

      // Check performance multiple times
      const alerts1 = await service.checkPerformance()
      const alerts2 = await service.checkPerformance()
      
      expect(alerts1).toHaveLength(1)
      expect(alerts2).toHaveLength(0) // No new alerts
    })
  })

  describe('Alert Management', () => {
    it('should resolve alerts', () => {
      const alert = service['createAlert']('error_rate', 'high', 'Test alert')
      service['alerts'].set(alert.id, alert)
      
      const resolved = service.resolveAlert(alert.id)
      
      expect(resolved).toBe(true)
      expect(alert.resolved).toBe(true)
    })

    it('should return false when resolving non-existent alert', () => {
      const resolved = service.resolveAlert('non-existent-id')
      expect(resolved).toBe(false)
    })

    it('should get active alerts only', () => {
      const alert1 = service['createAlert']('error_rate', 'high', 'Alert 1')
      const alert2 = service['createAlert']('memory', 'medium', 'Alert 2')
      alert2.resolved = true
      
      service['alerts'].set(alert1.id, alert1)
      service['alerts'].set(alert2.id, alert2)
      
      const activeAlerts = service.getActiveAlerts()
      
      expect(activeAlerts).toHaveLength(1)
      expect(activeAlerts[0].id).toBe(alert1.id)
    })

    it('should get alerts by type', () => {
      const alert1 = service['createAlert']('error_rate', 'high', 'Error alert')
      const alert2 = service['createAlert']('memory', 'medium', 'Memory alert')
      
      service['alerts'].set(alert1.id, alert1)
      service['alerts'].set(alert2.id, alert2)
      
      const errorAlerts = service.getAlertsByType('error_rate')
      const memoryAlerts = service.getAlertsByType('memory')
      
      expect(errorAlerts).toHaveLength(1)
      expect(errorAlerts[0].type).toBe('error_rate')
      expect(memoryAlerts).toHaveLength(1)
      expect(memoryAlerts[0].type).toBe('memory')
    })
  })

  describe('Threshold Management', () => {
    it('should update thresholds', () => {
      const newThresholds = {
        errorRate: 10,
        responseTimeP95: 3000
      }
      
      service.updateThresholds(newThresholds)
      const thresholds = service.getThresholds()
      
      expect(thresholds.errorRate).toBe(10)
      expect(thresholds.responseTimeP95).toBe(3000)
      expect(thresholds.memoryUsage).toBe(85) // Should keep existing values
    })
  })
})
