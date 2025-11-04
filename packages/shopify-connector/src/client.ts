/**
 * Shopify Admin API Client
 * Handles HTTP requests to Shopify Admin API with rate limiting and error handling
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { ShopifyConfig, ShopifyRateLimit } from './types';

interface AxiosErrorWithResponse extends AxiosError {
  response?: AxiosResponse<{
    errors?: Record<string, string[]>;
    message?: string;
  }>;
}

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
  private handleError(error: unknown): Error {
    // If it's already an Error instance with response data, enhance it
    if (error instanceof Error) {
      const axiosError = error as AxiosErrorWithResponse;
      if (axiosError.response?.data) {
        const enhancedError = error;
        const data = axiosError.response.data;
        const statusCode = axiosError.response.status;

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

        (enhancedError as Error & { statusCode?: number }).statusCode = statusCode;
        (enhancedError as Error & { responseData?: unknown }).responseData = data;

        // Log detailed error for 400 errors
        if (statusCode === 400) {
          const requestConfig = axiosError.config as AxiosRequestConfig | undefined;
          console.error('Shopify API 400 error:', {
            url: requestConfig?.url,
            method: requestConfig?.method,
            params: requestConfig?.params,
            statusCode,
            responseData: data,
          });
        }

        return enhancedError;
      }

      // If it's already a proper Error instance, return it
      return error;
    }

    // Extract error message from Shopify API response
    const axiosError = error as AxiosErrorWithResponse;
    let errorMessage = 'Unknown error';
    let statusCode: number | undefined;
    let responseData: unknown = null;

    if (axiosError.response?.data) {
      statusCode = axiosError.response.status;
      responseData = axiosError.response.data;

      if (responseData && typeof responseData === 'object' && 'errors' in responseData) {
        const data = responseData as { errors?: Record<string, string[]>; message?: string };
        // Format Shopify API errors
        if (data.errors && typeof data.errors === 'object') {
          const errorMessages: string[] = [];
          for (const key in data.errors) {
            if (Array.isArray(data.errors[key])) {
              errorMessages.push(...data.errors[key]);
            } else if (typeof data.errors[key] === 'string') {
              errorMessages.push(data.errors[key]);
            }
          }
          errorMessage = errorMessages.length > 0
            ? errorMessages.join(', ')
            : (data.message || 'Shopify API error');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (statusCode) {
          errorMessage = `Request failed with status code ${statusCode}`;
        }
      } else if (statusCode) {
        errorMessage = `Request failed with status code ${statusCode}`;
      }
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }

    // Log detailed error for 400 and 401 errors
    if (statusCode === 400 || statusCode === 401) {
      const requestConfig = axiosError.config as AxiosRequestConfig | undefined;
      console.error(`Shopify API ${statusCode} error:`, {
        url: requestConfig?.url,
        method: requestConfig?.method,
        params: requestConfig?.params,
        statusCode,
        responseData,
      });
    }

    // Provide better error message for 401 (authentication errors)
    if (statusCode === 401) {
      errorMessage = 'Authentication failed. The access token may be invalid or expired. Please reconnect your Shopify integration.';
    }

    // Create a proper Error instance with additional context
    const err = new Error(errorMessage);
    if (statusCode) {
      (err as Error & { statusCode?: number }).statusCode = statusCode;
    }
    if (responseData) {
      (err as Error & { responseData?: unknown }).responseData = responseData;
    }
    const requestConfig = axiosError.config as AxiosRequestConfig | undefined;
    if (requestConfig) {
      (err as Error & { requestConfig?: { url?: string; method?: string; params?: unknown } }).requestConfig = {
        url: requestConfig.url,
        method: requestConfig.method,
        params: requestConfig.params,
      };
    }

    return err;
  }

  /**
   * Make a GET request to Shopify Admin API
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  /**
   * Make a POST request to Shopify Admin API
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  /**
   * Make a PUT request to Shopify Admin API
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
