/**
 * Shopify OAuth Authentication
 * Handles OAuth 2.0 flow for Shopify app installation and token management
 */

import crypto from 'crypto';
import { ShopifyConfig, ShopifyAuth as ShopifyAuthType, ShopifyOAuthResponse } from './types';

export class ShopifyAuthManager {
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL for Shopify app installation
   */
  generateAuthUrl(shopDomain: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.apiKey,
      scope: this.config.scopes.join(','),
      redirect_uri: redirectUri,
      state: state || this.generateState(),
    });

    return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    shopDomain: string,
    code: string,
    redirectUri: string
  ): Promise<ShopifyOAuthResponse> {
    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.apiKey,
        client_secret: this.config.apiSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { error_description?: string; error?: string };
      throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
    }

    return await response.json() as ShopifyOAuthResponse;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const hash = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'base64'),
      Buffer.from(signature, 'base64')
    );
  }

  /**
   * Generate secure state parameter for OAuth flow
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate shop domain format
   */
  validateShopDomain(shopDomain: string): boolean {
    const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    return shopifyDomainRegex.test(shopDomain);
  }

  /**
   * Extract shop domain from full URL
   */
  extractShopDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      if (hostname.endsWith('.myshopify.com')) {
        return hostname;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create ShopifyAuth object from OAuth response
   */
  createAuthFromResponse(
    shopDomain: string,
    response: ShopifyOAuthResponse
  ): ShopifyAuthType {
    return {
      shopDomain,
      accessToken: response.access_token,
      scope: response.scope,
      expiresAt: response.expires_in
        ? new Date(Date.now() + response.expires_in * 1000)
        : undefined,
    };
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(auth: ShopifyAuthType): boolean {
    if (!auth.expiresAt) return false;
    return new Date() >= auth.expiresAt;
  }

  /**
   * Refresh access token (if supported by Shopify)
   * Note: Shopify doesn't support token refresh, this is for future compatibility
   */
  async refreshToken(): Promise<ShopifyAuthType> {
    // Shopify doesn't support token refresh
    // This method is here for interface compatibility
    throw new Error('Shopify does not support token refresh. Re-authentication required.');
  }
}
