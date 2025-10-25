import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (in production, use Redis)
const store: RateLimitStore = {}

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  return async (req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
    const key = keyGenerator(req)
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k]
      }
    })

    // Get or create rate limit entry
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    const entry = store[key]

    // Check if window has expired
    if (entry.resetTime < now) {
      entry.count = 0
      entry.resetTime = now + windowMs
    }

    // Check rate limit
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: maxRequests,
        remaining: 0,
        resetTime: entry.resetTime
      }, {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString()
        }
      })
    }

    // Increment counter
    entry.count++

    // Execute handler
    const response = await handler(req)

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count)
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())

    return response
  }
}

// Predefined rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    keyGenerator: (req) => req.ip || 'unknown'
  }),

  // Webhook rate limiting (more restrictive)
  webhook: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (req) => {
      const project = req.headers.get('x-calibr-project')
      return project ? `webhook:${project}` : req.ip || 'unknown'
    }
  }),

  // Price changes rate limiting
  priceChanges: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100,
    keyGenerator: (req) => {
      const project = req.headers.get('x-calibr-project')
      return project ? `price-changes:${project}` : req.ip || 'unknown'
    }
  }),

  // Health check rate limiting (very permissive)
  health: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
    keyGenerator: (req) => req.ip || 'unknown'
  })
}

// Utility function to apply rate limiting to API routes
export function withRateLimit(
  rateLimiter: ReturnType<typeof createRateLimit>,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return rateLimiter(req, handler)
  }
}
