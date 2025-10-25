/**
 * Performance Monitoring Middleware
 * Automatically tracks performance metrics for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordPerformanceMetric, recordErrorMetric, PerformanceMetric, ErrorMetric } from './performance-monitor'

export function withPerformanceMonitoring(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now()
    const endpoint = req.nextUrl.pathname
    const method = req.method
    
    // Extract context information
    const projectId = req.headers.get('x-calibr-project') || undefined
    const userId = req.headers.get('x-user-id') || undefined
    const userAgent = req.headers.get('user-agent') || undefined
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    
    let response: NextResponse
    let statusCode = 200
    let error: Error | null = null

    try {
      // Execute the original handler
      response = await handler(req, ...args)
      statusCode = response.status
    } catch (err) {
      error = err as Error
      statusCode = 500
      
      // Create error response
      response = NextResponse.json({
        error: 'Internal Server Error',
        message: error.message
      }, { status: 500 })
    } finally {
      const responseTime = Date.now() - startTime
      
      // Record performance metric
      const performanceMetric: PerformanceMetric = {
        timestamp: startTime,
        endpoint,
        method,
        responseTime,
        statusCode,
        projectId,
        userId,
        userAgent,
        ip
      }
      
      recordPerformanceMetric(performanceMetric)
      
      // Record error metric if there was an error
      if (statusCode >= 400 || error) {
        const errorMetric: ErrorMetric = {
          timestamp: startTime,
          endpoint,
          method,
          errorType: getErrorType(statusCode, error),
          errorMessage: error?.message || `HTTP ${statusCode}`,
          stackTrace: error?.stack,
          projectId,
          userId,
          statusCode
        }
        
        recordErrorMetric(errorMetric)
      }
    }

    return response
  }
}

/**
 * Higher-order function to wrap API route handlers with performance monitoring
 */
export function trackPerformance(handler: Function) {
  return withPerformanceMonitoring(handler)
}

/**
 * Middleware for tracking specific metrics
 */
export function trackMetrics(metrics: {
  endpoint?: string
  customTags?: Record<string, string>
}) {
  return function(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const startTime = Date.now()
      const endpoint = metrics.endpoint || req.nextUrl.pathname
      const method = req.method
      
      // Extract context
      const projectId = req.headers.get('x-calibr-project') || undefined
      const userId = req.headers.get('x-user-id') || undefined
      const userAgent = req.headers.get('user-agent') || undefined
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      
      let response: NextResponse
      let statusCode = 200
      let error: Error | null = null

      try {
        response = await handler(req, ...args)
        statusCode = response.status
      } catch (err) {
        error = err as Error
        statusCode = 500
        response = NextResponse.json({
          error: 'Internal Server Error',
          message: error.message
        }, { status: 500 })
      } finally {
        const responseTime = Date.now() - startTime
        
        // Record performance metric with custom tags
        const performanceMetric: PerformanceMetric = {
          timestamp: startTime,
          endpoint,
          method,
          responseTime,
          statusCode,
          projectId,
          userId,
          userAgent,
          ip
        }
        
        recordPerformanceMetric(performanceMetric)
        
        // Record error if applicable
        if (statusCode >= 400 || error) {
          const errorMetric: ErrorMetric = {
            timestamp: startTime,
            endpoint,
            method,
            errorType: getErrorType(statusCode, error),
            errorMessage: error?.message || `HTTP ${statusCode}`,
            stackTrace: error?.stack,
            projectId,
            userId,
            statusCode
          }
          
          recordErrorMetric(errorMetric)
        }
      }

      return response
    }
  }
}

/**
 * Utility function to get error type from status code and error
 */
function getErrorType(statusCode: number, error: Error | null): string {
  if (error) {
    if (error.name === 'ValidationError') return 'validation_error'
    if (error.name === 'AuthenticationError') return 'auth_error'
    if (error.name === 'AuthorizationError') return 'authz_error'
    if (error.name === 'NotFoundError') return 'not_found_error'
    if (error.name === 'RateLimitError') return 'rate_limit_error'
    if (error.name === 'DatabaseError') return 'database_error'
    return 'application_error'
  }
  
  if (statusCode >= 500) return 'server_error'
  if (statusCode >= 400) return 'client_error'
  if (statusCode >= 300) return 'redirect'
  return 'success'
}

/**
 * Performance monitoring decorator for class methods
 */
export function monitorPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now()
    const endpoint = `${target.constructor.name}.${propertyName}`
    
    try {
      const result = await method.apply(this, args)
      const responseTime = Date.now() - startTime
      
      recordPerformanceMetric({
        timestamp: startTime,
        endpoint,
        method: 'FUNCTION',
        responseTime,
        statusCode: 200
      })
      
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      recordPerformanceMetric({
        timestamp: startTime,
        endpoint,
        method: 'FUNCTION',
        responseTime,
        statusCode: 500
      })
      
      recordErrorMetric({
        timestamp: startTime,
        endpoint,
        method: 'FUNCTION',
        errorType: 'application_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? error.stack : undefined,
        statusCode: 500
      })
      
      throw error
    }
  }
}

/**
 * Batch performance tracking for multiple operations
 */
export class PerformanceTracker {
  private operations: Array<{
    name: string
    startTime: number
    endTime?: number
    error?: Error
  }> = []

  startOperation(name: string): void {
    this.operations.push({
      name,
      startTime: Date.now()
    })
  }

  endOperation(name: string, error?: Error): void {
    const operation = this.operations.find(op => op.name === name && !op.endTime)
    if (operation) {
      operation.endTime = Date.now()
      operation.error = error
    }
  }

  getResults(): Array<{
    name: string
    duration: number
    success: boolean
    error?: Error
  }> {
    return this.operations
      .filter(op => op.endTime)
      .map(op => ({
        name: op.name,
        duration: op.endTime! - op.startTime,
        success: !op.error,
        error: op.error
      }))
  }

  recordAll(): void {
    this.operations
      .filter(op => op.endTime)
      .forEach(op => {
        recordPerformanceMetric({
          timestamp: op.startTime,
          endpoint: `batch.${op.name}`,
          method: 'BATCH',
          responseTime: op.endTime! - op.startTime,
          statusCode: op.error ? 500 : 200
        })

        if (op.error) {
          recordErrorMetric({
            timestamp: op.startTime,
            endpoint: `batch.${op.name}`,
            method: 'BATCH',
            errorType: 'application_error',
            errorMessage: op.error.message,
            stackTrace: op.error.stack,
            statusCode: 500
          })
        }
      })
  }
}

/**
 * Performance monitoring for database operations
 */
export function trackDatabaseOperation(operationName: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const endpoint = `database.${operationName}`
      
      try {
        const result = await method.apply(this, args)
        const responseTime = Date.now() - startTime
        
        recordPerformanceMetric({
          timestamp: startTime,
          endpoint,
          method: 'DATABASE',
          responseTime,
          statusCode: 200
        })
        
        return result
      } catch (error) {
        const responseTime = Date.now() - startTime
        
        recordPerformanceMetric({
          timestamp: startTime,
          endpoint,
          method: 'DATABASE',
          responseTime,
          statusCode: 500
        })
        
        recordErrorMetric({
          timestamp: startTime,
          endpoint,
          method: 'DATABASE',
          errorType: 'database_error',
          errorMessage: error instanceof Error ? error.message : 'Database operation failed',
          stackTrace: error instanceof Error ? error.stack : undefined,
          statusCode: 500
        })
        
        throw error
      }
    }
  }
}
