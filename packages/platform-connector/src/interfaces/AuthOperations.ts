/**
 * AuthOperations Interface
 *
 * Interface for authentication and authorization operations.
 */

import { PlatformCredentials, PlatformError } from '../types/base';

/**
 * OAuth configuration
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;        // Seconds until expiration
  expiresAt?: Date;          // Absolute expiration time
  tokenType?: string;        // e.g., "Bearer"
  scope?: string;            // Granted scopes
}

/**
 * Authentication status
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  expiresAt?: Date;
  scope?: string[];
  userId?: string;           // Platform user/store ID
  error?: string;
}

/**
 * Authentication operations interface
 *
 * Handles authentication and credential management for platforms.
 */
export interface AuthOperations {
  /**
   * Check if currently authenticated
   *
   * @returns True if authenticated and credentials are valid
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Get current authentication status
   *
   * @returns Detailed authentication status
   */
  getAuthStatus(): Promise<AuthStatus>;

  /**
   * Authenticate with credentials
   *
   * For OAuth platforms, this may start the OAuth flow.
   * For API key platforms, this validates the API key.
   *
   * @param credentials - Platform-specific credentials
   * @throws PlatformError if authentication fails
   */
  authenticate(credentials: PlatformCredentials): Promise<void>;

  /**
   * Refresh authentication token (for OAuth platforms)
   *
   * @returns New token response
   * @throws PlatformError if refresh fails
   */
  refreshToken?(): Promise<OAuthTokenResponse>;

  /**
   * Revoke/invalidate current authentication
   */
  revoke(): Promise<void>;

  /**
   * Get OAuth authorization URL (for OAuth platforms)
   *
   * @param config - OAuth configuration
   * @returns Authorization URL to redirect user to
   *
   * @example
   * ```typescript
   * const authUrl = connector.auth.getAuthorizationUrl({
   *   clientId: 'abc123',
   *   clientSecret: 'secret',
   *   redirectUri: 'https://app.calibr.lat/oauth/callback',
   *   scopes: ['read_products', 'write_products']
   * });
   *
   * // Redirect user to authUrl
   * ```
   */
  getAuthorizationUrl?(config: OAuthConfig): string;

  /**
   * Handle OAuth callback and exchange code for token
   *
   * @param code - Authorization code from OAuth callback
   * @param config - OAuth configuration
   * @returns Token response
   * @throws PlatformError if token exchange fails
   *
   * @example
   * ```typescript
   * // In OAuth callback handler
   * const tokens = await connector.auth.handleOAuthCallback(code, {
   *   clientId: 'abc123',
   *   clientSecret: 'secret',
   *   redirectUri: 'https://app.calibr.lat/oauth/callback'
   * });
   *
   * // Store tokens.accessToken and tokens.refreshToken
   * ```
   */
  handleOAuthCallback?(code: string, config: OAuthConfig): Promise<OAuthTokenResponse>;

  /**
   * Validate API key or credentials
   *
   * @param credentials - Credentials to validate
   * @returns True if credentials are valid
   */
  validateCredentials?(credentials: PlatformCredentials): Promise<boolean>;
}
