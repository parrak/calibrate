/**
 * Request Monitoring Middleware
 * Integrates @calibr/monitor for request logging, performance tracking, and error monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createLogger,
  createRequestLogger,
  type Logger,
  LogLevel,
  recordPerformanceMetric,
  recordErrorMetric,
  type PerformanceMetric,
  type ErrorMetric
} from '@calibr/monitor'

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enableLogging?: boolean
  enablePerformanceTracking?: boolean
  enableErrorTracking?: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
  serviceName?: string
}

const defaultMonitoringConfig: MonitoringConfig = {
  enableLogging: true,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  serviceName: 'calibr-api'
}

/**
 * Create a logger instance for the API
 */
let apiLogger: Logger | null = null

function getLogger(config?: MonitoringConfig): Logger {
  if (!apiLogger) {
    let logLevel: LogLevel | undefined
    if (config?.logLevel) {
      logLevel = config.logLevel === 'error' ? LogLevel.ERROR :
        config.logLevel === 'warn' ? LogLevel.WARN :
        config.logLevel === 'info' ? LogLevel.INFO :
        config.logLevel === 'debug' ? LogLevel.DEBUG : undefined
    }
    apiLogger = createLogger({
      service: config?.serviceName || defaultMonitoringConfig.serviceName,
      environment: process.env.NODE_ENV,
      logLevel
    })
  }
  return apiLogger
}

/**
 * Extract request context for logging
 */
function extractRequestContext(req: NextRequest): {
  requestId: string
  projectId?: string
  userId?: string
  method: string
  url: string
  pathname: string
  userAgent?: string
  ip?: string
} {
  const requestId = req.headers.get('x-request-id') ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  const projectId = req.headers.get('x-calibr-project') || undefined
  const userId = req.headers.get('x-user-id') || undefined
  const url = req.url
  const pathname = new URL(url).pathname
  const userAgent = req.headers.get('user-agent') || undefined
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || undefined

  return {
    requestId,
    projectId,
    userId,
    method: req.method,
    url,
    pathname,
    userAgent,
    ip
  }
}

/**
 * Record performance metric for a request
 */
function recordRequestPerformance(
  context: ReturnType<typeof extractRequestContext>,
  response: NextResponse,
  startTime: number
) {
  if (!response) return

  const responseTime = Date.now() - startTime
  const statusCode = response.status

  const metric: PerformanceMetric = {
    timestamp: Date.now(),
    endpoint: context.pathname,
    method: context.method,
    responseTime,
    statusCode,
    projectId: context.projectId,
    userId: context.userId,
    userAgent: context.userAgent,
    ip: context.ip
  }

  recordPerformanceMetric(metric)
}

/**
 * Record error metric for a request
 */
function recordRequestError(
  context: ReturnType<typeof extractRequestContext>,
  error: Error,
  statusCode: number
) {
  const errorMetric: ErrorMetric = {
    timestamp: Date.now(),
    endpoint: context.pathname,
    method: context.method,
    errorType: error.name || 'Error',
    errorMessage: error.message,
    stackTrace: error.stack,
    projectId: context.projectId,
    userId: context.userId,
    statusCode
  }

  recordErrorMetric(errorMetric)
}

/**
 * Middleware to add monitoring to request handlers
 */
export function withMonitoring<TCtx = unknown>(
  handler: (req: NextRequest, ctx?: TCtx) => Promise<NextResponse>,
  config?: MonitoringConfig
) {
  const monitoringConfig = { ...defaultMonitoringConfig, ...config }
  const logger = getLogger(monitoringConfig)

  return async (req: NextRequest, ctx?: TCtx): Promise<NextResponse> => {
    const startTime = Date.now()
    const context = extractRequestContext(req)
    const requestLogger = createRequestLogger(logger, {
      headers: req.headers,
      url: req.url,
      method: req.method,
      ip: context.ip
    })

    // Add request ID to response headers for tracing
    const requestIdHeader = 'X-Request-ID'

    try {
      // Log request start
      if (monitoringConfig.enableLogging) {
        const queryParams = req.nextUrl?.searchParams
          ? Object.fromEntries(req.nextUrl.searchParams.entries())
          : {}
        requestLogger.info(`Request started: ${context.method} ${context.pathname}`, {
          metadata: {
            query: queryParams,
            headers: {
              'content-type': req.headers.get('content-type'),
              'accept': req.headers.get('accept')
            }
          }
        })
      }

      // Execute handler
      const response = await handler(req, ctx)

      // Add request ID to response
      if (response) {
        response.headers.set(requestIdHeader, context.requestId)
      }

      const finalResponse = response || new NextResponse(null, { status: 500 })

      // Record performance metric
      if (monitoringConfig.enablePerformanceTracking) {
        recordRequestPerformance(context, finalResponse, startTime)
      }

      // Log request completion
      if (monitoringConfig.enableLogging) {
        const responseTime = Date.now() - startTime
        const logMessage = `Request completed: ${context.method} ${context.pathname} - ${finalResponse.status} (${responseTime}ms)`
        const logContext = {
          metadata: {
            statusCode: finalResponse.status,
            responseTime
          }
        }

        if (finalResponse.status >= 500) {
          requestLogger.error(logMessage, undefined, logContext)
        } else if (finalResponse.status >= 400) {
          requestLogger.warn(logMessage, logContext)
        } else {
          requestLogger.info(logMessage, logContext)
        }
      }

      return finalResponse
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      const statusCode = errorObj instanceof Error && 'statusCode' in errorObj
        ? (errorObj as { statusCode?: number }).statusCode || 500
        : 500

      // Record error metric
      if (monitoringConfig.enableErrorTracking) {
        recordRequestError(context, errorObj, statusCode)
      }

      // Log error
      if (monitoringConfig.enableLogging) {
        requestLogger.error(`Request failed: ${context.method} ${context.pathname}`, errorObj, {
          metadata: {
            statusCode,
            responseTime: Date.now() - startTime
          }
        })
      }

      // Create error response with request ID
      const errorResponse = NextResponse.json(
        {
          error: errorObj.message || 'Internal server error',
          requestId: context.requestId
        },
        { status: statusCode }
      )
      errorResponse.headers.set(requestIdHeader, context.requestId)

      return errorResponse
    }
  }
}

/**
 * Export logger utilities for direct use in routes
 */
export { getLogger, createRequestLogger }

