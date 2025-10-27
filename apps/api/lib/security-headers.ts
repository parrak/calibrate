/**
 * Security Headers Middleware
 * Comprehensive security headers implementation
 */

import { NextRequest, NextResponse } from 'next/server'

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string
  strictTransportSecurity?: string
  xContentTypeOptions?: boolean
  xFrameOptions?: string
  xXSSProtection?: boolean
  referrerPolicy?: string
  permissionsPolicy?: string
  crossOriginEmbedderPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
  xDNSPrefetchControl?: boolean
  xDownloadOptions?: boolean
  xPermittedCrossDomainPolicies?: string
}

export const defaultSecurityHeaders: SecurityHeadersConfig = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xContentTypeOptions: true,
  xFrameOptions: 'DENY',
  xXSSProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  xDNSPrefetchControl: true,
  xDownloadOptions: true,
  xPermittedCrossDomainPolicies: 'none'
}

export class SecurityHeadersManager {
  private static instance: SecurityHeadersManager
  private config: SecurityHeadersConfig

  constructor(config: SecurityHeadersConfig = defaultSecurityHeaders) {
    this.config = { ...defaultSecurityHeaders, ...config }
  }

  static getInstance(config?: SecurityHeadersConfig): SecurityHeadersManager {
    if (!SecurityHeadersManager.instance) {
      SecurityHeadersManager.instance = new SecurityHeadersManager(config)
    }
    return SecurityHeadersManager.instance
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = this.generateSecurityHeaders()
    
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        response.headers.set(key, value)
      }
    })

    return response
  }

  /**
   * Generate security headers object
   */
  generateSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      headers['Content-Security-Policy'] = this.config.contentSecurityPolicy
    }

    // Strict Transport Security
    if (this.config.strictTransportSecurity) {
      headers['Strict-Transport-Security'] = this.config.strictTransportSecurity
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    // X-Frame-Options
    if (this.config.xFrameOptions) {
      headers['X-Frame-Options'] = this.config.xFrameOptions
    }

    // X-XSS-Protection
    if (this.config.xXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block'
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy
    }

    // Permissions Policy
    if (this.config.permissionsPolicy) {
      headers['Permissions-Policy'] = this.config.permissionsPolicy
    }

    // Cross-Origin Embedder Policy
    if (this.config.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy
    }

    // Cross-Origin Opener Policy
    if (this.config.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy
    }

    // Cross-Origin Resource Policy
    if (this.config.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy
    }

    // X-DNS-Prefetch-Control
    if (this.config.xDNSPrefetchControl) {
      headers['X-DNS-Prefetch-Control'] = 'off'
    }

    // X-Download-Options
    if (this.config.xDownloadOptions) {
      headers['X-Download-Options'] = 'noopen'
    }

    // X-Permitted-Cross-Domain-Policies
    if (this.config.xPermittedCrossDomainPolicies) {
      headers['X-Permitted-Cross-Domain-Policies'] = this.config.xPermittedCrossDomainPolicies
    }

    return headers
  }

  /**
   * Update security headers configuration
   */
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityHeadersConfig {
    return { ...this.config }
  }
}

/**
 * Middleware to apply security headers
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: SecurityHeadersConfig
) {
  const securityManager = SecurityHeadersManager.getInstance(config)

  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req)
    return securityManager.applySecurityHeaders(response)
  }
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  origin: string | string[] | ((origin: string) => boolean)
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge: number
  preflightContinue: boolean
  optionsSuccessStatus: number
}

export const defaultCORSConfig: CORSConfig = {
  origin: (origin) => {
    // Allow requests from same origin
    if (!origin) return true

    // Allow specific domains
    const allowedOrigins = [
      'https://calibr.lat',
      'https://console.calibr.lat',
      'https://docs.calibr.lat',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ]

    // Allow Vercel preview deployments for console
    // Check for both "console" pattern and rakesh-paridas-projects pattern
    if (origin.includes('.vercel.app')) {
      // Allow if contains "console" OR "rakesh-paridas-projects"
      if (origin.includes('console') || origin.includes('rakesh-paridas-projects')) {
        console.log('[CORS] Allowing Vercel origin:', origin)
        return true
      }
    }

    const allowed = allowedOrigins.includes(origin)
    if (!allowed) {
      console.log('[CORS] Rejecting origin:', origin)
    }
    return allowed
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Calibr-Signature',
    'X-Calibr-Project',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
}

export class CORSManager {
  private static instance: CORSManager
  private config: CORSConfig

  constructor(config: CORSConfig = defaultCORSConfig) {
    this.config = { ...defaultCORSConfig, ...config }
  }

  static getInstance(config?: CORSConfig): CORSManager {
    if (!CORSManager.instance) {
      CORSManager.instance = new CORSManager(config)
    }
    return CORSManager.instance
  }

  /**
   * Apply CORS headers to response
   */
  applyCORSHeaders(req: NextRequest, response: NextResponse): NextResponse {
    const origin = req.headers.get('origin')

    // Debug header to verify this code is running
    response.headers.set('X-CORS-Debug', `origin=${origin}`)

    // Set Access-Control-Allow-Origin
    if (this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('X-CORS-Allowed', 'true')
    } else {
      response.headers.set('X-CORS-Allowed', 'false')
    }

    // Set other CORS headers
    response.headers.set('Access-Control-Allow-Methods', this.config.methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Max-Age', this.config.maxAge.toString())

    if (this.config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
  }

  /**
   * Handle preflight requests
   */
  handlePreflight(req: NextRequest): NextResponse | null {
    if (req.method !== 'OPTIONS') {
      return null
    }

    const origin = req.headers.get('origin')
    if (!this.isOriginAllowed(origin)) {
      return new NextResponse(null, { status: 403 })
    }

    const response = new NextResponse(null, { status: this.config.optionsSuccessStatus })
    return this.applyCORSHeaders(req, response)
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string | null): boolean {
    if (!origin) return true

    if (typeof this.config.origin === 'function') {
      return this.config.origin(origin)
    }

    if (Array.isArray(this.config.origin)) {
      return this.config.origin.includes(origin)
    }

    return this.config.origin === origin || this.config.origin === '*'
  }

  /**
   * Update CORS configuration
   */
  updateConfig(newConfig: Partial<CORSConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

/**
 * Middleware to apply CORS
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: CORSConfig
) {
  const corsManager = CORSManager.getInstance(config)

  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    const preflightResponse = corsManager.handlePreflight(req)
    if (preflightResponse) {
      return preflightResponse
    }

    // Process the request
    const response = await handler(req)
    
    // Apply CORS headers
    return corsManager.applyCORSHeaders(req, response)
  }
}

/**
 * Combined security middleware
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    securityHeaders?: SecurityHeadersConfig
    cors?: CORSConfig
  }
) {
  const securityHandler = withSecurityHeaders(handler, options?.securityHeaders)
  return withCORS(securityHandler, options?.cors)
}

// Export singleton instances
export const securityHeadersManager = SecurityHeadersManager.getInstance()
export const corsManager = CORSManager.getInstance()
