import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  startResourceMonitoring, 
  stopResourceMonitoring,
  recordResourceMetric,
  getResourceStats,
  clearResourceMetrics
} from '../lib/performance-monitor'

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Clear any existing intervals
    stopResourceMonitoring()
    vi.clearAllTimers()
    vi.useFakeTimers()
    
    // Clear any existing resource metrics
    clearResourceMetrics()
  })

  afterEach(() => {
    stopResourceMonitoring()
    vi.useRealTimers()
  })

  describe('Resource Monitoring', () => {
    it('should start resource monitoring with interval', () => {
      startResourceMonitoring(1000) // 1 second interval
      
      // Check that resource metrics are being recorded
      const stats = getResourceStats(60000) // 1 minute
      expect(stats.length).toBeGreaterThan(0)
      
      // Fast-forward time to trigger interval
      vi.advanceTimersByTime(1000)
      
      // Should have recorded more metrics
      const statsAfter = getResourceStats(60000)
      expect(statsAfter.length).toBeGreaterThan(stats.length)
    })

    it('should not create multiple intervals when called multiple times', () => {
      // Call startResourceMonitoring multiple times
      startResourceMonitoring(1000)
      startResourceMonitoring(1000)
      startResourceMonitoring(1000)
      
      // Fast-forward time
      vi.advanceTimersByTime(1000)
      
      // Should only have the initial metrics + one interval (not 3x)
      // Each call to startResourceMonitoring records an initial metric, so we expect:
      // - 1 initial metric from first call
      // - 1 initial metric from second call (replaces first interval)
      // - 1 initial metric from third call (replaces second interval)
      // - 1 interval call
      const stats = getResourceStats(60000)
      expect(stats.length).toBeLessThanOrEqual(4) // 3 initial calls + 1 interval
    })

    it('should stop resource monitoring', () => {
      startResourceMonitoring(1000)
      
      // Get initial count
      const initialStats = getResourceStats(60000)
      const initialCount = initialStats.length
      
      stopResourceMonitoring()
      
      // Fast-forward time
      vi.advanceTimersByTime(2000)
      
      // Should only have the initial metrics, no new ones
      const finalStats = getResourceStats(60000)
      expect(finalStats.length).toBe(initialCount)
    })

    it('should record resource metrics correctly', () => {
      recordResourceMetric()
      
      const stats = getResourceStats(60000) // 1 minute
      expect(stats.length).toBeGreaterThan(0)
      
      // Check the most recent metric
      const latestMetric = stats[stats.length - 1]
      expect(latestMetric).toHaveProperty('timestamp')
      expect(latestMetric).toHaveProperty('memory')
      expect(latestMetric).toHaveProperty('cpu')
      expect(latestMetric).toHaveProperty('uptime')
      expect(latestMetric.memory).toHaveProperty('used')
      expect(latestMetric.memory).toHaveProperty('total')
      expect(latestMetric.cpu).toHaveProperty('loadAverage')
    })
  })
})
