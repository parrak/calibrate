/**
 * Shopify Admin API Client
 * Handles HTTP requests to Shopify Admin API with rate limiting and error handling
 */
import axios from 'axios';
import { ShopifyConfig, ShopifyRateLimit } from './types';

export class ShopifyClient {
  private client;
  private config: ShopifyConfig;
  private rateLimit: ShopifyRateLimit | null = null;

  constructor(config: ShopifyConfig) {
    this.config = config;
    const shopDomain = config.shopDomain || `${config.apiKey}.myshopify.com`;
    this.client = axios.create({
      baseURL: `https://${shopDomain}/admin/api/${config.apiVersion || '2024-10'}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Calibrate-Pricing-Platform/1.0',
        ...(config.accessToken ? { 'X-Shopify-Access-Token': config.accessToken } : {}),
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request/response interceptors for rate limiting and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor to add authentication
    this.client.interceptors.request.use((config) => {
      if (this.config.accessToken) {
        config.headers['X-Shopify-Access-Token'] = this.config.accessToken;
      }
      return config;
    });

    // Response interceptor to handle rate limiting
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimit(response);
        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          // Rate limited
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter) {
            const waitTime = parseInt(retryAfter) * 1000;
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(this.client.request(error.config));
              }, waitTime);
            });
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimit(response: any): void {
    const limit = response.headers['x-shopify-shop-api-call-limit'];
    if (limit) {
      const [used, total] = limit.split('/').map(Number);
      this.rateLimit = {
        limit: total,
        remaining: total - used,
        resetTime: new Date(Date.now() + 1000), // Reset every second
      };
    }
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleError(error: any): any {
    if (error.response?.data) {
      return {
        errors: error.response.data.errors || {
          general: [error.response.data.message || 'Unknown error'],
        },
      };
    }
    return {
      errors: {
        general: [error.message || 'Network error'],
      },
    };
  }

  /**
   * Make a GET request to Shopify Admin API
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  /**
   * Make a POST request to Shopify Admin API
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  /**
   * Make a PUT request to Shopify Admin API
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  /**
   * Make a DELETE request to Shopify Admin API
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint);
    return response.data;
  }

  /**
   * Get current rate limit information
   */
  getRateLimit(): ShopifyRateLimit | null {
    return this.rateLimit;
  }

  /**
   * Check if we're approaching rate limits
   */
  isNearRateLimit(): boolean {
    if (!this.rateLimit) return false;
    return this.rateLimit.remaining < 10; // Less than 10 requests remaining
  }

  /**
   * Wait if we're near rate limits
   */
  async waitIfNeeded(): Promise<void> {
    if (this.isNearRateLimit()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
