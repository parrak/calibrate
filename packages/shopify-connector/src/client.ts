/**
 * Shopify Admin API Client
 * Handles HTTP requests to Shopify Admin API with rate limiting and error handling
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ShopifyConfig, ShopifyApiError, ShopifyRateLimit } from './types';

export class ShopifyClient {
  private client: AxiosInstance;
  private config: ShopifyConfig;
  private shopDomain?: string;
  private accessToken?: string;
  private rateLimit: ShopifyRateLimit | null = null;

  constructor(config: ShopifyConfig & { shopDomain?: string; accessToken?: string }) {
    this.config = config;
    this.shopDomain = config.shopDomain;
    this.accessToken = config.accessToken;
    
    // Use shopDomain if provided, otherwise fall back to apiKey (for backwards compatibility)
    const domain = this.shopDomain || `${config.apiKey}.myshopify.com`;
    
    this.client = axios.create({
      baseURL: `https://${domain}/admin/api/${config.apiVersion || '2024-10'}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Calibrate-Pricing-Platform/1.0',
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
      // Use accessToken if provided, otherwise fall back to apiKey (for backwards compatibility)
      const token = this.accessToken || this.config.apiKey;
      if (token) {
        config.headers['X-Shopify-Access-Token'] = token;
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
        // Handle error and return a proper Error instance
        const handledError = this.handleError(error);
        return Promise.reject(handledError);
      }
    );
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimit(response: AxiosResponse): void {
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
  private handleError(error: any): Error {
    // If it's already an Error instance with response data, enhance it
    if (error instanceof Error && (error as any).response?.data) {
      const enhancedError = error;
      const data = (error as any).response.data;
      const statusCode = (error as any).response.status;
      
      // Enhance error message with Shopify error details
      if (data.errors && typeof data.errors === 'object') {
        const errorMessages: string[] = [];
        for (const key in data.errors) {
          if (Array.isArray(data.errors[key])) {
            errorMessages.push(...data.errors[key]);
          } else if (typeof data.errors[key] === 'string') {
            errorMessages.push(data.errors[key]);
          }
        }
        if (errorMessages.length > 0) {
          enhancedError.message = `${error.message} | ${errorMessages.join(', ')}`;
        }
      }
      
      (enhancedError as any).statusCode = statusCode;
      (enhancedError as any).responseData = data;
      
      // Log detailed error for 400 errors
      if (statusCode === 400) {
        console.error('Shopify API 400 error:', {
          url: (error as any).config?.url,
          method: (error as any).config?.method,
          params: (error as any).config?.params,
          statusCode,
          responseData: data,
        });
      }
      
      return enhancedError;
    }
    
    // If it's already a proper Error instance, return it
    if (error instanceof Error) {
      return error;
    }

    // Extract error message from Shopify API response
    let errorMessage = 'Unknown error';
    let statusCode: number | undefined;
    let responseData: any = null;
    
    if (error.response?.data) {
      statusCode = error.response.status;
      responseData = error.response.data;
      
      if (responseData.errors && typeof responseData.errors === 'object') {
        // Format Shopify API errors
        const errorMessages: string[] = [];
        for (const key in responseData.errors) {
          if (Array.isArray(responseData.errors[key])) {
            errorMessages.push(...responseData.errors[key]);
          } else if (typeof responseData.errors[key] === 'string') {
            errorMessages.push(responseData.errors[key]);
          }
        }
        errorMessage = errorMessages.length > 0 
          ? errorMessages.join(', ') 
          : (responseData.message || 'Shopify API error');
      } else if (responseData.message) {
        errorMessage = responseData.message;
      } else if (statusCode) {
        errorMessage = `Request failed with status code ${statusCode}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Log detailed error for 400 errors
    if (statusCode === 400) {
      console.error('Shopify API 400 error:', {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        statusCode,
        responseData,
      });
    }

    // Create a proper Error instance with additional context
    const err = new Error(errorMessage);
    if (statusCode) {
      (err as any).statusCode = statusCode;
    }
    if (responseData) {
      (err as any).responseData = responseData;
    }
    if (error.config) {
      (err as any).requestConfig = {
        url: error.config.url,
        method: error.config.method,
        params: error.config.params,
      };
    }
    
    return err;
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
