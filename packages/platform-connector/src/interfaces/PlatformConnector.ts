/**
 * PlatformConnector Interface
 *
 * Main interface that all platform connectors must implement.
 * This is the primary contract between the platform abstraction layer
 * and specific platform implementations (Shopify, Amazon, etc.)
 */

import { PlatformType, PlatformHealth, PlatformCredentials, PlatformConfig } from '../types/base';
import { PlatformCapabilities } from '../types/integration';
import { ProductOperations } from './ProductOperations';
import { PricingOperations } from './PricingOperations';
import { AuthOperations } from './AuthOperations';

/**
 * Main platform connector interface
 *
 * @example
 * ```typescript
 * import { PlatformConnector } from '@calibr/platform-connector';
 *
 * export class ShopifyConnector implements PlatformConnector {
 *   readonly platform = 'shopify';
 *   readonly name = 'Shopify';
 *   readonly version = '1.0.0';
 *
 *   constructor(private config: ShopifyConfig) {
 *     // Initialize connector
 *   }
 *
 *   // Implement all required methods...
 * }
 * ```
 */
export interface PlatformConnector {
  /**
   * Platform identifier
   */
  readonly platform: PlatformType;

  /**
   * Human-readable platform name
   */
  readonly name: string;

  /**
   * Connector version
   */
  readonly version: string;

  /**
   * Platform capabilities
   */
  readonly capabilities: PlatformCapabilities;

  /**
   * Configuration
   */
  readonly config: PlatformConfig;

  /**
   * Authentication operations
   */
  readonly auth: AuthOperations;

  /**
   * Product operations
   */
  readonly products: ProductOperations;

  /**
   * Pricing operations
   */
  readonly pricing: PricingOperations;

  /**
   * Check if the connector is authenticated and ready
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Initialize the connector with credentials
   */
  initialize(credentials: PlatformCredentials): Promise<void>;

  /**
   * Disconnect and cleanup resources
   */
  disconnect(): Promise<void>;

  /**
   * Health check for the platform connection
   */
  healthCheck(): Promise<PlatformHealth>;

  /**
   * Test the connection with a lightweight operation
   */
  testConnection(): Promise<boolean>;
}

/**
 * Platform connector constructor interface
 */
export interface PlatformConnectorConstructor {
  new (config: PlatformConfig, credentials?: PlatformCredentials): PlatformConnector;
}

/**
 * Platform connector factory function
 */
export type PlatformConnectorFactory = (
  config: PlatformConfig,
  credentials?: PlatformCredentials
) => Promise<PlatformConnector>;
