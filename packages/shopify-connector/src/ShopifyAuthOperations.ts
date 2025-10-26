/**
 * Shopify Auth Operations
 * Implements AuthOperations interface for Shopify OAuth
 */
import { AuthOperations, AuthStatus, OAuthConfig, OAuthTokenResponse, PlatformCredentials } from '@calibr/platform-connector';
import { PlatformError } from '@calibr/platform-connector';
import { ShopifyConnector } from './ShopifyConnector';

export class ShopifyAuthOperations implements AuthOperations {
  private connector: ShopifyConnector;

  constructor(connector: ShopifyConnector) {
    this.connector = connector;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.connector.isAuthenticated();
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const isAuth = await this.isAuthenticated();

    if (!isAuth) {
      return {
        isAuthenticated: false,
        error: 'No credentials provided',
      };
    }

    const credentials = this.connector['credentials'];

    return {
      isAuthenticated: true,
      scope: credentials.scope?.split(',') || ['read_products', 'write_products'],
      userId: credentials.shopDomain,
    };
  }

  async authenticate(credentials: PlatformCredentials): Promise<void> {
    await this.connector.initialize(credentials);
  }

  async revoke(): Promise<void> {
    await this.connector.disconnect();
  }

  // OAuth flow methods
  getAuthorizationUrl(config: OAuthConfig): string {
    const { clientId, redirectUri, scopes, state } = config;
    const credentials = this.connector['credentials'];
    const shop = credentials?.shopDomain || '';

    if (!shop) {
      throw new PlatformError('validation', 'Shop domain is required for OAuth authorization', 'shopify');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      redirect_uri: redirectUri,
      state: state || '',
    });

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, config: OAuthConfig): Promise<OAuthTokenResponse> {
    const { clientId, clientSecret, redirectUri } = config;
    const credentials = this.connector['credentials'];
    const shop = credentials?.shopDomain || '';

    if (!shop) {
      throw new PlatformError('validation', 'Shop domain is required for OAuth callback', 'shopify');
    }

    try {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new PlatformError(
          'authentication',
          `OAuth token exchange failed: ${errorData.error_description || errorData.error}`,
          'shopify'
        );
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        scope: data.scope,
        tokenType: 'Bearer',
        expiresIn: data.expires_in,
      };
    } catch (error) {
      if (error instanceof PlatformError) {
        throw error;
      }

      throw new PlatformError(
        'network',
        `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'shopify',
        error instanceof Error ? error : undefined
      );
    }
  }

  async refreshToken(): Promise<OAuthTokenResponse> {
    // Shopify doesn't support token refresh
    throw new PlatformError('authentication', 'Shopify does not support token refresh. Re-authentication required.', 'shopify');
  }

  async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
    try {
      const shopifyCredentials = credentials as any;

      if (!shopifyCredentials.shopDomain || !shopifyCredentials.accessToken) {
        return false;
      }

      // Test the credentials by making a lightweight API call
      const tempConnector = new ShopifyConnector(this.connector.config, shopifyCredentials);
      return await tempConnector.testConnection();
    } catch {
      return false;
    }
  }

  async getTokenInfo(): Promise<{
    scope: string[];
    expiresAt?: Date;
    shopDomain: string;
  }> {
    const credentials = this.connector['credentials'];

    if (!credentials) {
      throw new PlatformError('authentication', 'No credentials available', 'shopify');
    }

    return {
      scope: credentials.scope?.split(',') || [],
      expiresAt: credentials.expiresAt,
      shopDomain: credentials.shopDomain,
    };
  }
}
