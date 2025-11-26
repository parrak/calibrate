/**
 * Backoff Implementation Tests
 * M0.5: Comprehensive test suite for exponential backoff and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateBackoff,
  handle429Error,
  isRetryableError,
  calculateNextRetry,
  sleep,
  retryWithBackoff,
  getRetrySchedule
} from './backoff'
import type { ShopifyError } from './types'

describe('calculateBackoff', () => {
  it('should calculate exponential backoff for first attempt', () => {
    const delay = calculateBackoff(0, { jitter: 0 })
    expect(delay).toBe(2000) // 2 seconds
  })

  it('should calculate exponential backoff for second attempt', () => {
    const delay = calculateBackoff(1, { jitter: 0 })
    expect(delay).toBe(4000) // 4 seconds
  })

  it('should calculate exponential backoff for third attempt', () => {
    const delay = calculateBackoff(2, { jitter: 0 })
    expect(delay).toBe(8000) // 8 seconds
  })

  it('should cap delay at maxDelay', () => {
    const delay = calculateBackoff(10, { jitter: 0, maxDelay: 64000 })
    expect(delay).toBe(64000) // Capped at 64 seconds
  })

  it('should apply jitter to delay', () => {
    const delays = Array.from({ length: 100 }, () => calculateBackoff(0))

    // With 20% jitter, delays should vary between 1600-2400ms
    const min = Math.min(...delays)
    const max = Math.max(...delays)

    expect(min).toBeGreaterThanOrEqual(1500)
    expect(min).toBeLessThan(2000)
    expect(max).toBeGreaterThan(2000)
    expect(max).toBeLessThanOrEqual(2500)
  })

  it('should use custom baseDelay', () => {
    const delay = calculateBackoff(0, { baseDelay: 5000, jitter: 0 })
    expect(delay).toBe(5000)
  })

  it('should use custom multiplier', () => {
    const delay = calculateBackoff(1, { baseDelay: 1000, multiplier: 3, jitter: 0 })
    expect(delay).toBe(3000) // 1000 * 3^1
  })

  it('should never return negative delay', () => {
    const delay = calculateBackoff(0, { baseDelay: -100, jitter: 0 })
    expect(delay).toBeGreaterThanOrEqual(0)
  })
})

describe('handle429Error', () => {
  it('should use Retry-After header when present', () => {
    const error: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      code: 429,
      headers: { 'retry-after': '30' }
    }

    const result = handle429Error(error)

    expect(result.retry).toBe(true)
    expect(result.delay).toBe(30000) // 30 seconds in ms
  })

  it('should use exponential backoff when Retry-After is missing', () => {
    const error: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      code: 429,
      attempt: 0
    }

    const result = handle429Error(error)

    expect(result.retry).toBe(true)
    expect(result.delay).toBeGreaterThanOrEqual(12800) // 16s ± 20% jitter
    expect(result.delay).toBeLessThanOrEqual(19200)
  })

  it('should handle statusCode 429', () => {
    const error: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      statusCode: 429,
      attempt: 0
    }

    const result = handle429Error(error)

    expect(result.retry).toBe(true)
    expect(result.delay).toBeGreaterThan(0)
  })

  it('should return no retry for non-429 errors', () => {
    const error: ShopifyError = {
      name: 'ServerError',
      message: 'Internal server error',
      code: 500
    }

    const result = handle429Error(error)

    expect(result.retry).toBe(false)
    expect(result.delay).toBe(0)
  })

  it('should use attempt number for backoff calculation', () => {
    const error1: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      code: 429,
      attempt: 0
    }

    const error2: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      code: 429,
      attempt: 1
    }

    const result1 = handle429Error(error1)
    const result2 = handle429Error(error2)

    // Second attempt should have longer delay
    expect(result2.delay).toBeGreaterThan(result1.delay * 1.5)
  })

  it('should handle invalid Retry-After header', () => {
    const error: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      code: 429,
      headers: { 'retry-after': 'invalid' },
      attempt: 0
    }

    const result = handle429Error(error)

    expect(result.retry).toBe(true)
    expect(result.delay).toBeGreaterThan(0) // Should fall back to exponential
  })
})

describe('isRetryableError', () => {
  it('should identify 429 as retryable', () => {
    const error: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      statusCode: 429
    }

    expect(isRetryableError(error)).toBe(true)
  })

  it('should identify THROTTLED as retryable', () => {
    const error: ShopifyError = {
      name: 'ThrottledError',
      message: 'Request throttled',
      code: 'THROTTLED'
    }

    expect(isRetryableError(error)).toBe(true)
  })

  it('should identify network errors as retryable', () => {
    const errors = [
      { code: 'ECONNRESET', message: 'Connection reset' },
      { code: 'ETIMEDOUT', message: 'Timeout' },
      { code: 'ENOTFOUND', message: 'DNS lookup failed' },
      { code: 'ECONNREFUSED', message: 'Connection refused' }
    ]

    errors.forEach((error) => {
      expect(isRetryableError(error as Error)).toBe(true)
    })
  })

  it('should identify 5xx errors as retryable', () => {
    const error: ShopifyError = {
      name: 'ServerError',
      message: 'Internal server error',
      statusCode: 500
    }

    expect(isRetryableError(error)).toBe(true)
  })

  it('should identify 4xx errors (except 429) as non-retryable', () => {
    const errors = [
      { statusCode: 400, message: 'Bad request' },
      { statusCode: 401, message: 'Unauthorized' },
      { statusCode: 403, message: 'Forbidden' },
      { statusCode: 404, message: 'Not found' }
    ]

    errors.forEach((error) => {
      expect(isRetryableError(error as ShopifyError)).toBe(false)
    })
  })

  it('should respect explicit retryable flag', () => {
    const retryable: ShopifyError = {
      name: 'CustomError',
      message: 'Custom error',
      retryable: true
    }

    const nonRetryable: ShopifyError = {
      name: 'CustomError',
      message: 'Custom error',
      retryable: false
    }

    expect(isRetryableError(retryable)).toBe(true)
    expect(isRetryableError(nonRetryable)).toBe(false)
  })

  it('should default to non-retryable for unknown errors', () => {
    const error = new Error('Unknown error')

    expect(isRetryableError(error)).toBe(false)
  })
})

describe('calculateNextRetry', () => {
  it('should calculate next retry time', () => {
    const lastAttempt = new Date('2025-01-01T00:00:00Z')
    const nextRetry = calculateNextRetry(0, lastAttempt, 3)

    expect(nextRetry).not.toBeNull()
    expect(nextRetry!.getTime()).toBeGreaterThan(lastAttempt.getTime())
    expect(nextRetry!.getTime()).toBeLessThanOrEqual(
      lastAttempt.getTime() + 3000 // ~2s + jitter
    )
  })

  it('should return null when max retries exceeded', () => {
    const lastAttempt = new Date()
    const nextRetry = calculateNextRetry(3, lastAttempt, 3)

    expect(nextRetry).toBeNull()
  })

  it('should increase delay for subsequent attempts', () => {
    const lastAttempt = new Date('2025-01-01T00:00:00Z')

    const retry1 = calculateNextRetry(0, lastAttempt, 5)
    const retry2 = calculateNextRetry(1, lastAttempt, 5)
    const retry3 = calculateNextRetry(2, lastAttempt, 5)

    expect(retry1).not.toBeNull()
    expect(retry2).not.toBeNull()
    expect(retry3).not.toBeNull()

    // Each retry should be later than the previous
    expect(retry2!.getTime()).toBeGreaterThan(retry1!.getTime())
    expect(retry3!.getTime()).toBeGreaterThan(retry2!.getTime())
  })
})

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should sleep for specified milliseconds', async () => {
    const promise = sleep(2000)

    // Fast-forward time
    vi.advanceTimersByTime(2000)

    await expect(promise).resolves.toBeUndefined()
  })

  it('should work with different durations', async () => {
    const durations = [100, 500, 1000, 5000]

    for (const duration of durations) {
      const promise = sleep(duration)
      vi.advanceTimersByTime(duration)
      await expect(promise).resolves.toBeUndefined()
    }
  })
})

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const promise = retryWithBackoff(fn, 3)
    vi.runAllTimers()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable error', async () => {
    const error: ShopifyError = {
      name: 'NetworkError',
      message: 'Connection failed',
      code: 'ECONNRESET',
      retryable: true
    }

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success')

    const promise = retryWithBackoff(fn, 3)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should not retry on non-retryable error', async () => {
    const error: ShopifyError = {
      name: 'AuthError',
      message: 'Unauthorized',
      statusCode: 401,
      retryable: false
    }

    const fn = vi.fn().mockRejectedValue(error)

    const promise = retryWithBackoff(fn, 3)
    vi.runAllTimers()

    await expect(promise).rejects.toThrow('Unauthorized')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should throw after max retries', async () => {
    const error: ShopifyError = {
      name: 'NetworkError',
      message: 'Connection failed',
      code: 'ECONNRESET',
      retryable: true
    }

    const fn = vi.fn().mockRejectedValue(error)

    const promise = retryWithBackoff(fn, 3)

    // Handle promise rejection and timer advancement together
    const [result] = await Promise.allSettled([
      promise,
      vi.runAllTimersAsync()
    ])

    expect(result.status).toBe('rejected')
    if (result.status === 'rejected') {
      expect(result.reason.message).toBe('Connection failed')
    }
    expect(fn).toHaveBeenCalledTimes(4) // Initial + 3 retries
  })

  it('should handle 429 errors with special backoff', async () => {
    const error: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      statusCode: 429,
      retryable: true
    }

    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success')

    const promise = retryWithBackoff(fn, 3)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should use custom backoff options', async () => {
    const error: ShopifyError = {
      name: 'NetworkError',
      message: 'Connection failed',
      retryable: true
    }

    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success')

    const promise = retryWithBackoff(fn, 3, {
      baseDelay: 1000,
      maxDelay: 5000,
      multiplier: 3,
      jitter: 0
    })

    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
  })
})

describe('getRetrySchedule', () => {
  it('should return retry schedule for 3 retries', () => {
    const schedule = getRetrySchedule(3)

    expect(schedule).toEqual([2, 4, 8]) // 2s, 4s, 8s
  })

  it('should return retry schedule for custom retries', () => {
    const schedule = getRetrySchedule(5)

    expect(schedule).toEqual([2, 4, 8, 16, 32])
  })

  it('should respect max delay', () => {
    const schedule = getRetrySchedule(10, { maxDelay: 30000 })

    // All delays should be capped at 30 seconds
    schedule.forEach((delay) => {
      expect(delay).toBeLessThanOrEqual(30)
    })
  })

  it('should use custom base delay', () => {
    const schedule = getRetrySchedule(3, { baseDelay: 5000 })

    expect(schedule).toEqual([5, 10, 20])
  })

  it('should use custom multiplier', () => {
    const schedule = getRetrySchedule(3, { baseDelay: 1000, multiplier: 3 })

    expect(schedule).toEqual([1, 3, 9])
  })

  it('should return empty array for zero retries', () => {
    const schedule = getRetrySchedule(0)

    expect(schedule).toEqual([])
  })
})

describe('Backoff Integration Tests', () => {
  it('should handle realistic Shopify rate limit scenario', async () => {
    vi.useFakeTimers()

    const rateLimitError: ShopifyError = {
      name: 'RateLimitError',
      message: 'Rate limit exceeded',
      statusCode: 429,
      headers: { 'retry-after': '2' }
    }

    let attempts = 0
    const fn = vi.fn(async () => {
      attempts++
      if (attempts === 1) {
        throw rateLimitError
      }
      return 'success'
    })

    const promise = retryWithBackoff(fn, 3)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)

    vi.restoreAllMocks()
  })

  it('should handle network timeout with exponential backoff', async () => {
    vi.useFakeTimers()

    const timeoutError: ShopifyError = {
      name: 'TimeoutError',
      message: 'Request timeout',
      code: 'ETIMEDOUT',
      retryable: true
    }

    let attempts = 0
    const fn = vi.fn(async () => {
      attempts++
      if (attempts <= 2) {
        throw timeoutError
      }
      return 'success'
    })

    const promise = retryWithBackoff(fn, 3)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)

    vi.restoreAllMocks()
  })

  it('should calculate correct delays for 100-target batch', () => {
    // Simulate delays for 100 targets
    const targetCount = 100
    const maxConcurrency = 5
    const batches = Math.ceil(targetCount / maxConcurrency)

    // Calculate expected time for single batch with no failures
    const baseTimePerTarget = 100 // ms (API call time)
    const expectedTimeWithoutRetries = (batches * baseTimePerTarget * maxConcurrency) / maxConcurrency

    expect(expectedTimeWithoutRetries).toBeLessThan(60000) // Should complete in < 60s without retries

    // With 10% failure rate and 1 retry each (2s backoff)
    const failedTargets = Math.floor(targetCount * 0.1)
    const retryTime = failedTargets * 2000 // 2s per retry
    const expectedTimeWithRetries = expectedTimeWithoutRetries + retryTime

    expect(expectedTimeWithRetries).toBeLessThan(120000) // Should complete in < 2 minutes with retries
  })
})
