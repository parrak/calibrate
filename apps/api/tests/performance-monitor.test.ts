import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  startResourceMonitoring, 
  stopResourceMonitoring,
  recordResourceMetric,
  getResourceStats
} from '../lib/performance-monitor'

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Clear any existing intervals
    stopResourceMonitoring()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    stopResourceMonitoring()
    vi.useRealTimers()
  })

  describe('Resource Monitoring', () => {
    it('should start resource monitoring with interval', () => {
      const recordSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      startResourceMonitoring(1000) // 1 second interval
      
      // Should record initial metric
      expect(recordSpy).toHaveBeenCalled()
      
      // Fast-forward time to trigger interval
      vi.advanceTimersByTime(1000)
      
      // Should have recorded another metric
      expect(recordSpy).toHaveBeenCalledTimes(2)
      
      recordSpy.mockRestore()
    })

    it('should not create multiple intervals when called multiple times', () => {
      const recordSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Call startResourceMonitoring multiple times
      startResourceMonitoring(1000)
      startResourceMonitoring(1000)
      startResourceMonitoring(1000)
      
      // Fast-forward time
      vi.advanceTimersByTime(1000)
      
      // Should only have the initial call + one interval call (not 3)
      expect(recordSpy).toHaveBeenCalledTimes(2)
      
      recordSpy.mockRestore()
    })

    it('should stop resource monitoring', () => {
      const recordSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      startResourceMonitoring(1000)
      stopResourceMonitoring()
      
      // Fast-forward time
      vi.advanceTimersByTime(2000)
      
      // Should only have the initial call, no interval calls
      expect(recordSpy).toHaveBeenCalledTimes(1)
      
      recordSpy.mockRestore()
    })

    it('should record resource metrics correctly', () => {
      recordResourceMetric()
      
      const stats = getResourceStats(60000) // 1 minute
      expect(stats).toHaveLength(1)
      expect(stats[0]).toHaveProperty('timestamp')
      expect(stats[0]).toHaveProperty('memory')
      expect(stats[0]).toHaveProperty('cpu')
      expect(stats[0]).toHaveProperty('uptime')
      expect(stats[0].memory).toHaveProperty('used')
      expect(stats[0].memory).toHaveProperty('total')
      expect(stats[0].cpu).toHaveProperty('loadAverage')
    })
  })
})
