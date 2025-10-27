/**
 * Shopify-specific types and interfaces
 */

export interface ShopifyConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  webhookSecret: string;
  apiVersion?: string;
  shopDomain?: string; // Required for client initialization
  accessToken?: string; // Required for authentication
}

export interface ShopifyAuth {
  shopDomain: string;
  accessToken: string;
  scope: string;
  expiresAt?: Date;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  variants: ShopifyVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyVariant {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity?: number;
  inventoryPolicy: 'deny' | 'continue';
  fulfillmentService: string;
  inventoryManagement?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyPriceUpdate {
  variantId: string;
  price: string;
  compareAtPrice?: string;
}

export interface ShopifyWebhook {
  id: string;
  topic: string;
  address: string;
  format: 'json' | 'xml';
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyWebhookPayload {
  id: string;
  topic: string;
  shop_domain: string;
  created_at: string;
  data: any;
}

export interface ShopifyOAuthResponse {
  access_token: string;
  scope: string;
  expires_in?: number;
}

export interface ShopifyApiError {
  errors: {
    [key: string]: string[];
  };
}

export interface ShopifyRateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface ShopifySyncResult {
  success: boolean;
  productsProcessed: number;
  errors: string[];
  lastSyncAt: Date;
}

export interface ShopifyWebhookVerification {
  isValid: boolean;
  payload: ShopifyWebhookPayload | null;
  error?: string;
}
