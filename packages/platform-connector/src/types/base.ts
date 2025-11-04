/**
 * Base Platform Types
 *
 * Core type definitions for the platform connector abstraction layer.
 * These types are platform-agnostic and used across all connector implementations.
 */

/**
 * Supported e-commerce platforms
 */
export type PlatformType = 'shopify' | 'amazon' | 'google_shopping' | 'woocommerce' | 'bigcommerce' | 'custom';

/**
 * Connection status for platform integrations
 *
 * The connector layer historically used lowercase identifiers while the API
 * and console UIs expect uppercase variants (e.g. `CONNECTED`). To keep the
 * shared types compatible across both contexts we expose a union that
 * includes the base lowercase literals and their uppercase counterparts.
 */
type ConnectionStatusBase =
  | 'connected'      // Successfully connected and active
  | 'disconnected'   // Not connected or disconnected by user
  | 'error'          // Connection error or authentication failed
  | 'pending'        // Connection in progress
  | 'expired';       // Credentials expired, needs re-authentication

export type ConnectionStatus = ConnectionStatusBase | Uppercase<ConnectionStatusBase>;

/**
 * Sync status for platform data synchronization
 *
 * Similar to connection status, sync states can be emitted in either casing
 * depending on the API surface. We also support the Shopify specific
 * `in_progress` state to cover long running background syncs.
 */
type SyncStatusBase =
  | 'idle'           // No sync in progress
  | 'syncing'        // Sync currently in progress
  | 'success'        // Last sync completed successfully
  | 'error'          // Last sync failed
  | 'partial'        // Sync partially completed
  | 'in_progress';   // Sync currently in progress via job queue

export type SyncStatus = SyncStatusBase | Uppercase<SyncStatusBase>;

/**
 * Platform health status
 */
export interface PlatformHealth {
  isHealthy: boolean;
  status: ConnectionStatus;
  lastChecked: Date;
  message?: string;
  latency?: number; // Response time in ms
}

/**
 * Platform credentials (base interface)
 * Platform-specific implementations will extend this
 */
export interface PlatformCredentials {
  platform: PlatformType;
  [key: string]: any;
}

/**
 * Platform configuration metadata
 */
export interface PlatformConfig {
  platform: PlatformType;
  name: string;          // Display name (e.g., "Shopify Store")
  isActive: boolean;
  connectedAt?: Date;
  lastSyncAt?: Date;
  metadata?: Record<string, any>; // Platform-specific metadata
}

/**
 * Error types for platform operations
 */
export type PlatformErrorType =
  | 'authentication'   // Auth/credential errors
  | 'authorization'    // Permission/scope errors
  | 'rate_limit'       // API rate limit exceeded
  | 'network'          // Network/connectivity errors
  | 'validation'       // Input validation errors
  | 'not_found'        // Resource not found
  | 'conflict'         // Conflict/duplicate errors
  | 'server'           // Platform server errors
  | 'unknown';         // Unknown errors

/**
 * Standardized platform error
 */
export class PlatformError extends Error {
  constructor(
    public type: PlatformErrorType,
    message: string,
    public platform: PlatformType,
    public originalError?: Error,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;  // For cursor-based pagination
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * Filter options for platform queries
 */
export interface FilterOptions {
  search?: string;
  tags?: string[];
  status?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  [key: string]: any; // Platform-specific filters
}
