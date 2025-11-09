/**
 * Correlation ID Middleware
 * Extracts correlation ID from headers or generates a new one
 */

import { NextRequest, NextResponse } from 'next/server'

// Generate a simple correlation ID
function generateCorrelationId(): string {
  return `corr_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`
}

// Extract correlation ID from request headers or generate a new one
export function getCorrelationId(req: NextRequest): string {
  // Try to get correlation ID from standard headers
  const headerNames = [
    'x-correlation-id',
    'x-request-id',
    'x-trace-id',
    'correlation-id',
  ]

  for (const headerName of headerNames) {
    const value = req.headers.get(headerName)
    if (value) {
      return value
    }
  }

  // Generate new correlation ID if not found
  return generateCorrelationId()
}

// Attach correlation ID to request context
export interface RequestContext {
  correlationId: string
  requestId: string
}

// Store correlation ID in async local storage (simplified version)
// In production, you would use AsyncLocalStorage from async_hooks
const contextStore = new Map<string, RequestContext>()

export function getRequestContext(correlationId: string): RequestContext | undefined {
  return contextStore.get(correlationId)
}

export function setRequestContext(context: RequestContext): void {
  contextStore.set(context.correlationId, context)
}

export function clearRequestContext(correlationId: string): void {
  contextStore.delete(correlationId)
}

type RouteHandler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>

/**
 * Middleware to ensure correlation ID is available for the request
 */
export function withCorrelation(handler: RouteHandler) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const correlationId = getCorrelationId(req)
    const requestId = `req_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`

    // Store context
    const context: RequestContext = {
      correlationId,
      requestId,
    }
    setRequestContext(context)

    try {
      // Execute the handler
      const response = await handler(req, ...args)

      // Add correlation ID to response headers
      response.headers.set('X-Correlation-ID', correlationId)
      response.headers.set('X-Request-ID', requestId)

      return response
    } finally {
      // Clean up context
      clearRequestContext(correlationId)
    }
  }
}

/**
 * Get correlation ID from the current request
 * This is a helper function to be used in route handlers
 */
export function getCurrentCorrelationId(req: NextRequest): string {
  return getCorrelationId(req)
}

/**
 * Attach correlation ID to an object (e.g., audit record, log entry)
 */
export function attachCorrelationId<T extends Record<string, any>>(
  req: NextRequest,
  obj: T
): T & { correlationId: string } {
  return {
    ...obj,
    correlationId: getCorrelationId(req),
  }
}
