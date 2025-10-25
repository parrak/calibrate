/**
 * Pricing Types
 *
 * Normalized pricing types for price updates across all platforms.
 */

import { PlatformType } from './base';

/**
 * Price update operation type
 */
export type PriceUpdateType = 'set' | 'increase' | 'decrease';

/**
 * Price update status
 */
export type PriceUpdateStatus =
  | 'pending'       // Queued for update
  | 'processing'    // Update in progress
  | 'completed'     // Successfully applied
  | 'failed'        // Update failed
  | 'rolled_back';  // Update was rolled back

/**
 * Normalized price
 */
export interface NormalizedPrice {
  externalId: string;        // Platform-specific product/variant ID
  platform: PlatformType;
  price: number;             // Current price in cents
  compareAtPrice?: number;   // Compare-at price in cents
  currency: string;          // ISO currency code
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Price update request
 */
export interface PriceUpdate {
  externalId: string;        // Platform-specific product/variant ID
  sku?: string;              // Alternative identifier
  price: number;             // New price in cents
  compareAtPrice?: number;   // New compare-at price in cents (optional)
  currency: string;          // ISO currency code
  effectiveDate?: Date;      // When to apply (defaults to immediate)
  metadata?: Record<string, any>; // Additional context
}

/**
 * Price update result
 */
export interface PriceUpdateResult {
  externalId: string;
  platform: PlatformType;
  success: boolean;
  oldPrice?: number;
  newPrice?: number;
  currency: string;
  updatedAt: Date;
  error?: string;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Batch price update request
 */
export interface BatchPriceUpdate {
  updates: PriceUpdate[];
  validateOnly?: boolean;    // Dry run mode
  stopOnError?: boolean;     // Stop batch on first error
  metadata?: Record<string, any>;
}

/**
 * Batch price update result
 */
export interface BatchUpdateResult {
  total: number;
  successful: number;
  failed: number;
  results: PriceUpdateResult[];
  errors?: Array<{
    externalId: string;
    error: string;
  }>;
  completedAt: Date;
}

/**
 * Price history entry
 */
export interface PriceHistoryEntry {
  externalId: string;
  platform: PlatformType;
  price: number;
  compareAtPrice?: number;
  currency: string;
  changedAt: Date;
  changedBy?: string;        // User or system that made the change
  reason?: string;           // Why the price changed
}
