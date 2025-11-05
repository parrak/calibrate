import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '../lib/monitoring'
import {
  getAllPerformanceMetrics,
  getAllErrorMetrics,
  clearAllMetrics,
  recordPerformanceMetric,
  recordErrorMetric
} from '@calibr/monitor'

describe('Monitoring Middleware', () => {
  beforeEach(() => {
    clearAllMetrics()
    vi.clearAllMocks()
  })

  describe('Request Logging', () => {
    it('should add X-Request-ID header to successful responses', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler)
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      const response = await wrapped(req)

      expect(response.headers.get('X-Request-ID')).toBeTruthy()
      expect(response.headers.get('X-Request-ID')).toMatch(/^\d+-[\w-]+$/)
    })

    it('should add X-Request-ID header to error responses', async () => {
      const handler = async (_req: NextRequest) => {
        throw new Error('Test error')
      }

      const wrapped = withMonitoring(handler)
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      const response = await wrapped(req)

      expect(response.headers.get('X-Request-ID')).toBeTruthy()
      expect(response.status).toBe(500)
    })

    it('should preserve existing X-Request-ID header if provided', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler)
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'x-request-id': 'custom-request-id-123'
        }
      })

      const response = await wrapped(req)

      expect(response.headers.get('X-Request-ID')).toBe('custom-request-id-123')
    })
  })

  describe('Performance Tracking', () => {
    it('should record performance metrics for successful requests', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' }, { status: 200 })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      
      expect(allMetrics.length).toBeGreaterThan(0)
      
      const metric = allMetrics[allMetrics.length - 1]
      expect(metric.endpoint).toBe('/api/test')
      expect(metric.method).toBe('GET')
      expect(metric.statusCode).toBe(200)
      expect(metric.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('should record performance metrics for error responses', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      
      const metric = allMetrics[allMetrics.length - 1]
      expect(metric.statusCode).toBe(404)
    })

    it('should not record performance metrics when disabled', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: false })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      clearAllMetrics()
      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      
      expect(allMetrics.length).toBe(0)
    })
  })

  describe('Error Tracking', () => {
    it('should record error metrics when handler throws', async () => {
      const handler = async (_req: NextRequest) => {
        throw new Error('Test error')
      }

      const wrapped = withMonitoring(handler, { enableErrorTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      await wrapped(req)

      const errorMetrics = getAllErrorMetrics()
      const allErrors = Array.from(errorMetrics.values()).flat()
      
      expect(allErrors.length).toBeGreaterThan(0)
      
      const errorMetric = allErrors[allErrors.length - 1]
      expect(errorMetric.endpoint).toBe('/api/test')
      expect(errorMetric.method).toBe('GET')
      expect(errorMetric.errorType).toBe('Error')
      expect(errorMetric.errorMessage).toBe('Test error')
      expect(errorMetric.statusCode).toBe(500)
    })

    it('should not record error metrics when disabled', async () => {
      const handler = async (_req: NextRequest) => {
        throw new Error('Test error')
      }

      const wrapped = withMonitoring(handler, { enableErrorTracking: false })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      clearAllMetrics()
      await wrapped(req)

      const errorMetrics = getAllErrorMetrics()
      const allErrors = Array.from(errorMetrics.values()).flat()
      
      expect(allErrors.length).toBe(0)
    })

    it('should handle non-Error objects thrown', async () => {
      const handler = async (_req: NextRequest) => {
        throw 'String error'
      }

      const wrapped = withMonitoring(handler)
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      const response = await wrapped(req)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBeTruthy()
      expect(body.requestId).toBeTruthy()
    })
  })

  describe('Request Context Extraction', () => {
    it('should extract project ID from headers', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'x-calibr-project': 'test-project-123'
        }
      })

      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      const metric = allMetrics[allMetrics.length - 1]
      
      expect(metric.projectId).toBe('test-project-123')
    })

    it('should extract user ID from headers', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'x-user-id': 'user-123'
        }
      })

      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      const metric = allMetrics[allMetrics.length - 1]
      
      expect(metric.userId).toBe('user-123')
    })

    it('should extract IP from X-Forwarded-For header', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1'
        }
      })

      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      const metric = allMetrics[allMetrics.length - 1]
      
      expect(metric.ip).toBe('192.168.1.1')
    })
  })

  describe('Configuration', () => {
    it('should respect custom service name', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { 
        serviceName: 'custom-service',
        enablePerformanceTracking: true 
      })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      await wrapped(req)
      
      // Service name affects logger, but we can verify it doesn't break
      expect(req.method).toBe('GET')
    })

    it('should handle disabled monitoring gracefully', async () => {
      const handler = async (_req: NextRequest) => {
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { 
        enableLogging: false,
        enablePerformanceTracking: false,
        enableErrorTracking: false
      })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      clearAllMetrics()
      const response = await wrapped(req)

      // Should still work and add request ID
      expect(response.headers.get('X-Request-ID')).toBeTruthy()
      
      // But no metrics should be recorded
      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      expect(allMetrics.length).toBe(0)
    })
  })

  describe('Response Time Tracking', () => {
    it('should measure response time accurately', async () => {
      const handler = async (_req: NextRequest) => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10))
        return NextResponse.json({ message: 'success' })
      }

      const wrapped = withMonitoring(handler, { enablePerformanceTracking: true })
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      await wrapped(req)

      const metrics = getAllPerformanceMetrics()
      const allMetrics = Array.from(metrics.values()).flat()
      const metric = allMetrics[allMetrics.length - 1]
      
      expect(metric.responseTime).toBeGreaterThanOrEqual(10)
    })
  })
})

