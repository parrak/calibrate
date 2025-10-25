/**
 * Error Utilities
 *
 * Helper functions for error handling and creation.
 */

import { PlatformType, PlatformError, PlatformErrorType } from '../types/base';

/**
 * Create a PlatformError with proper typing
 */
export function createPlatformError(
  type: PlatformErrorType,
  message: string,
  platform: PlatformType,
  originalError?: Error,
  retryable: boolean = false
): PlatformError {
  return new PlatformError(type, message, platform, originalError, retryable);
}

/**
 * Check if an error is a PlatformError
 */
export function isPlatformError(error: unknown): error is PlatformError {
  return error instanceof PlatformError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isPlatformError(error)) {
    return error.retryable;
  }
  return false;
}

/**
 * Get error type from error
 */
export function getErrorType(error: unknown): PlatformErrorType {
  if (isPlatformError(error)) {
    return error.type;
  }
  return 'unknown';
}

/**
 * Convert any error to a PlatformError
 */
export function toPlatformError(
  error: unknown,
  platform: PlatformType,
  defaultMessage: string = 'An unknown error occurred'
): PlatformError {
  if (isPlatformError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new PlatformError('unknown', error.message, platform, error);
  }

  return new PlatformError('unknown', defaultMessage, platform);
}

/**
 * Error messages for common platform errors
 */
export const ErrorMessages = {
  NOT_AUTHENTICATED: 'Not authenticated. Please authenticate first.',
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  RATE_LIMIT_EXCEEDED: 'API rate limit exceeded. Please try again later.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  NOT_FOUND: 'Resource not found.',
  INVALID_INPUT: 'Invalid input provided.',
  SERVER_ERROR: 'Platform server error. Please try again later.',
  PERMISSION_DENIED: 'Permission denied. Check your API scopes.',
} as const;
