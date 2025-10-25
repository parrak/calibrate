/**
 * Integration Types
 *
 * Types for managing platform integrations and connections.
 */

import { PlatformType, ConnectionStatus, SyncStatus } from './base';

/**
 * Platform integration metadata
 */
export interface PlatformIntegration {
  id: string;
  projectId: string;
  platform: PlatformType;
  platformName: string;        // User-friendly name (e.g., "My Shopify Store")
  externalId?: string;         // Platform-specific identifier
  status: ConnectionStatus;
  isActive: boolean;
  connectedAt: Date;
  lastSyncAt?: Date;
  lastHealthCheck?: Date;
  syncStatus?: SyncStatus;
  syncError?: string;
  metadata?: Record<string, any>; // Platform-specific data
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  autoSync: boolean;
  syncInterval?: number;       // Minutes between syncs
  syncProducts: boolean;
  syncPrices: boolean;
  syncInventory: boolean;
  lastSync?: Date;
}

/**
 * Sync log entry
 */
export interface SyncLogEntry {
  id: string;
  integrationId: string;
  syncType: 'full' | 'incremental' | 'manual';
  status: 'started' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  itemsSynced: number;
  itemsFailed: number;
  errors?: Array<{
    item: string;
    error: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  supportsOAuth: boolean;
  supportsWebhooks: boolean;
  supportsBatchUpdates: boolean;
  supportsInventoryTracking: boolean;
  supportsVariants: boolean;
  supportsCompareAtPrice: boolean;
  maxBatchSize?: number;
  rateLimit?: {
    requestsPerSecond: number;
    requestsPerDay?: number;
  };
}
