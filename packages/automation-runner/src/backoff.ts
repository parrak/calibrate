/**
 * Exponential Backoff Implementation
 * M0.5: Handles retry delays with exponential backoff and jitter
 */

import type { BackoffOptions, BackoffResult, ShopifyError } from './types'
import { DEFAULT_BACKOFF_OPTIONS, RATE_LIMIT_BACKOFF_OPTIONS } from './config'

/**
 * Calculate exponential backoff delay with jitter
 *
 * Formula: delay = min(baseDelay * (multiplier ^ attempt), maxDelay) ± jitter
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Backoff configuration options
 * @returns Delay in milliseconds
 *
 * @example
 * calculateBackoff(0) // ~2000ms (2s ± 20%)
 * calculateBackoff(1) // ~4000ms (4s ± 20%)
 * calculateBackoff(2) // ~8000ms (8s ± 20%)
 */
export function calculateBackoff(
  attempt: number,
  options: Partial<BackoffOptions> = {}
): number {
  const config = { ...DEFAULT_BACKOFF_OPTIONS, ...options }
  const { baseDelay, maxDelay, multiplier, jitter } = config

  // Exponential calculation: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt)

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay)

  // Add random jitter: ±jitter%
  const jitterAmount = cappedDelay * jitter
  const randomJitter = Math.random() * jitterAmount * 2 - jitterAmount

  const finalDelay = cappedDelay + randomJitter

  // Ensure non-negative
  return Math.max(0, Math.floor(finalDelay))
}

/**
 * Handle 429 rate limit errors with smart backoff
 *
 * Checks for Retry-After header and uses exponential backoff as fallback
 *
 * @param error - Shopify or API error object
 * @returns Backoff result with delay and retry flag
 *
 * @example
 * const result = handle429Error(error)
 * if (result.retry) {
 *   await sleep(result.delay)
 *   // Retry operation
 * }
 */
export function handle429Error(error: ShopifyError): BackoffResult {
  // Check if it's a rate limit error
  if (error.code !== 429 && error.statusCode !== 429) {
    return { delay: 0, retry: false }
  }

  // Check for Retry-After header (preferred)
  const retryAfter = error.headers?.['retry-after']
  if (retryAfter) {
    const seconds = parseInt(retryAfter)
    if (!isNaN(seconds)) {
      return {
        delay: seconds * 1000, // Convert to milliseconds
        retry: true
      }
    }
  }

  // Fallback to exponential backoff
  // Use longer delays for rate limits (16s, 32s, 64s)
  const attempt = error.attempt || 0
  const delay = calculateBackoff(attempt, RATE_LIMIT_BACKOFF_OPTIONS)

  return {
    delay,
    retry: true
  }
}

/**
 * Determine if an error is retryable
 *
 * @param error - Error object
 * @returns True if error should be retried
 */
export function isRetryableError(error: Error): boolean {
  const retryable = (error as ShopifyError).retryable

  // Explicit retryable flag
  if (typeof retryable === 'boolean') {
    return retryable
  }

  // Check error type/code
  const errorCode = (error as ShopifyError).code
  const statusCode = (error as ShopifyError).statusCode

  // Retryable error codes
  const retryableCodes = [
    429, // Rate limit
    'ECONNRESET', // Connection reset
    'ETIMEDOUT', // Timeout
    'ENOTFOUND', // DNS lookup failed
    'ECONNREFUSED', // Connection refused
    'THROTTLED' // Shopify throttling
  ]

  // Check if error code matches
  if (errorCode && retryableCodes.includes(errorCode)) {
    return true
  }

  // Check if status code is retryable (5xx errors)
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true
  }

  // Check if it's a 429
  if (statusCode === 429) {
    return true
  }

  // Default: not retryable
  return false
}

/**
 * Calculate next retry time for a target
 *
 * @param attempts - Current number of attempts
 * @param lastAttempt - Last attempt timestamp
 * @param maxRetries - Maximum retries allowed
 * @returns Next retry timestamp or null if max retries exceeded
 */
export function calculateNextRetry(
  attempts: number,
  lastAttempt: Date,
  maxRetries: number
): Date | null {
  if (attempts >= maxRetries) {
    return null // Max retries exceeded
  }

  const delay = calculateBackoff(attempts)
  const nextRetry = new Date(lastAttempt.getTime() + delay)

  return nextRetry
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 *
 * @example
 * await sleep(2000) // Sleep for 2 seconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param options - Backoff options
 * @returns Result of function or throws last error
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => api.updatePrice(sku, price),
 *   3
 * )
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  options: Partial<BackoffOptions> = {}
): Promise<T> {
  let lastError: Error | undefined
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if retryable
      if (!isRetryableError(lastError)) {
        throw lastError
      }

      // Check if max retries exceeded
      if (attempt >= maxRetries) {
        throw lastError
      }

      // Calculate delay
      let delay: number

      // Handle 429 specially
      if (
        (lastError as ShopifyError).code === 429 ||
        (lastError as ShopifyError).statusCode === 429
      ) {
        const backoffResult = handle429Error(lastError as ShopifyError)
        delay = backoffResult.delay
      } else {
        delay = calculateBackoff(attempt, options)
      }

      // Sleep before retry
      await sleep(delay)

      attempt++
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError
}

/**
 * Get human-readable retry schedule
 *
 * @param maxRetries - Maximum retries
 * @param options - Backoff options
 * @returns Array of delay times in seconds
 *
 * @example
 * getRetrySchedule(3)
 * // Returns: [2, 4, 8] (approximately, with jitter)
 */
export function getRetrySchedule(
  maxRetries: number = 3,
  options: Partial<BackoffOptions> = {}
): number[] {
  const schedule: number[] = []

  for (let i = 0; i < maxRetries; i++) {
    const delayMs = calculateBackoff(i, { ...options, jitter: 0 }) // No jitter for display
    schedule.push(Math.round(delayMs / 1000)) // Convert to seconds
  }

  return schedule
}
