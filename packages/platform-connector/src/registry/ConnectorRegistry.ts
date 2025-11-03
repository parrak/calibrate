/**
 * Connector Registry
 *
 * Central registry for managing platform connector implementations.
 */

import { PlatformType, PlatformConfig, PlatformCredentials, PlatformError } from '../types/base';
import { PlatformConnector, PlatformConnectorFactory } from '../interfaces/PlatformConnector';

/**
 * Registry for platform connectors
 *
 * This singleton class manages the registration and instantiation
 * of platform connectors.
 *
 * @example
 * ```typescript
 * import { ConnectorRegistry } from '@calibr/platform-connector';
 * import { ShopifyConnector } from '@calibr/shopify-connector';
 *
 * // Register a connector
 * ConnectorRegistry.register('shopify', async (config, credentials) => {
 *   const connector = new ShopifyConnector(config, credentials);
 *   if (credentials) {
 *     await connector.initialize(credentials);
 *   }
 *   return connector;
 * });
 *
 * // Get a connector instance
 * const connector = await ConnectorRegistry.getConnector('shopify', config, credentials);
 * ```
 */
export class ConnectorRegistry {
  private static factories = new Map<PlatformType, PlatformConnectorFactory>();
  private static instances = new Map<string, PlatformConnector>();

  /**
   * Register a platform connector factory
   *
   * @param platform - Platform type
   * @param factory - Factory function to create connector instances
   */
  static register(platform: PlatformType, factory: PlatformConnectorFactory): void {
    this.factories.set(platform, factory);
  }

  /**
   * Unregister a platform connector
   *
   * @param platform - Platform type to unregister
   */
  static unregister(platform: PlatformType): void {
    this.factories.delete(platform);
    // Clean up any instances for this platform without relying on downlevel iteration
    this.instances.forEach((connector, key) => {
      if (connector.platform === platform) {
        this.instances.delete(key);
      }
    });
  }

  /**
   * Check if a platform is registered
   *
   * @param platform - Platform type to check
   * @returns True if platform is registered
   */
  static isRegistered(platform: PlatformType): boolean {
    return this.factories.has(platform);
  }

  /**
   * Get list of all registered platforms
   *
   * @returns Array of registered platform types
   */
  static getRegisteredPlatforms(): PlatformType[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get or create a connector instance
   *
   * @param platform - Platform type
   * @param config - Platform configuration
   * @param credentials - Optional credentials for initialization
   * @param cacheKey - Optional cache key for instance reuse
   * @returns Platform connector instance
   * @throws PlatformError if platform is not registered
   */
  static async getConnector(
    platform: PlatformType,
    config: PlatformConfig,
    credentials?: PlatformCredentials,
    cacheKey?: string
  ): Promise<PlatformConnector> {
    const factory = this.factories.get(platform);

    if (!factory) {
      throw new PlatformError(
        'unknown',
        `Platform '${platform}' is not registered. Please register the connector first.`,
        platform
      );
    }

    // Use cache if cacheKey is provided
    if (cacheKey) {
      const cached = this.instances.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Create new instance
    const connector = await factory(config, credentials);

    // Cache if cacheKey provided
    if (cacheKey) {
      this.instances.set(cacheKey, connector);
    }

    return connector;
  }

  /**
   * Create a new connector instance without caching
   *
   * @param platform - Platform type
   * @param config - Platform configuration
   * @param credentials - Optional credentials for initialization
   * @returns Platform connector instance
   */
  static async createConnector(
    platform: PlatformType,
    config: PlatformConfig,
    credentials?: PlatformCredentials
  ): Promise<PlatformConnector> {
    return this.getConnector(platform, config, credentials);
  }

  /**
   * Remove a connector from cache
   *
   * @param cacheKey - Cache key to remove
   */
  static clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.instances.delete(cacheKey);
    } else {
      this.instances.clear();
    }
  }

  /**
   * Get cached connector instance
   *
   * @param cacheKey - Cache key
   * @returns Cached connector or undefined
   */
  static getCached(cacheKey: string): PlatformConnector | undefined {
    return this.instances.get(cacheKey);
  }

  /**
   * Reset the registry (mainly for testing)
   */
  static reset(): void {
    this.factories.clear();
    this.instances.clear();
  }
}
