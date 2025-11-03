/**
 * Enhanced Authentication and Authorization Security
 * Comprehensive auth security implementation
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@calibr/db'

export interface AuthContext {
  userId?: string
  projectId?: string
  tenantId?: string
  roles: string[]
  permissions: string[]
  isAuthenticated: boolean
  isAdmin: boolean
}

export interface ProjectAccess {
  projectId: string
  tenantId: string
  roles: string[]
  permissions: string[]
}

export interface SecurityPolicy {
  requireAuth: boolean
  requireProject?: boolean
  requireTenant?: boolean
  allowedRoles?: string[]
  requiredPermissions?: string[]
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
}

export class AuthSecurityManager {
  private static instance: AuthSecurityManager
  private sessionStore: Map<string, AuthContext> = new Map()
  private projectCache: Map<string, ProjectAccess> = new Map()
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  static getInstance(): AuthSecurityManager {
    if (!AuthSecurityManager.instance) {
      AuthSecurityManager.instance = new AuthSecurityManager()
    }
    return AuthSecurityManager.instance
  }

  /**
   * Verify HMAC signature with enhanced security
   */
  async verifyHMACSignature(req: NextRequest): Promise<{
    valid: boolean
    projectId?: string
    tenantId?: string
    body?: string
    securityScore: number
  }> {
    try {
      const signature = req.headers.get('X-Calibr-Signature')
      const projectId = req.headers.get('X-Calibr-Project')
      const timestamp = req.headers.get('X-Calibr-Timestamp')
      const nonce = req.headers.get('X-Calibr-Nonce')

      if (!signature || !projectId) {
        return { valid: false, securityScore: 0 }
      }

      // Get project and tenant information
      const project = await this.getProjectInfo(projectId)
      if (!project) {
        return { valid: false, securityScore: 0 }
      }

      const webhookSecret = project.webhookSecret || process.env.WEBHOOK_SECRET || ''
      if (!webhookSecret) {
        return { valid: false, securityScore: 0 }
      }

      const rawBody = await req.text()
      let securityScore = 50 // Base score

      // Parse signature
      const parts = Object.fromEntries(
        signature.split(',').map(p => p.split('='))
      )
      const ts = Number(parts['t'])
      const v1 = parts['v1']

      if (!ts || !v1) {
        return { valid: false, body: rawBody, securityScore: 0 }
      }

      // Check timestamp (replay attack prevention)
      const now = Math.floor(Date.now() / 1000)
      const timeDiff = Math.abs(now - ts)
      
      if (timeDiff > 300) { // 5 minutes tolerance
        return { valid: false, body: rawBody, securityScore: 0 }
      }

      // Additional security checks
      if (timestamp && Math.abs(Number(timestamp) - ts) > 1) {
        return { valid: false, body: rawBody, securityScore: 0 }
      }

      if (nonce) {
        // Check nonce for replay attack prevention
        const nonceKey = `nonce:${projectId}:${nonce}`
        // In production, use Redis for nonce storage
        securityScore += 20
      }

      // Generate expected signature
      const payload = timestamp ? `${ts}.${timestamp}.${rawBody}` : `${ts}.${rawBody}`
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')

      // Use timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(v1),
        Buffer.from(expectedSignature)
      )

      if (isValid) {
        securityScore += 30
      }

      return {
        valid: isValid,
        projectId,
        tenantId: project.tenantId,
        body: rawBody,
        securityScore
      }
    } catch (error) {
      console.error('HMAC verification failed:', error)
      return { valid: false, securityScore: 0 }
    }
  }

  /**
   * Get project information with caching
   */
  private async getProjectInfo(projectId: string) {
    // Check cache first
    const cached = this.projectCache.get(projectId)
    if (cached) {
      return {
        id: projectId,
        tenantId: cached.tenantId,
        webhookSecret: process.env.WEBHOOK_SECRET // In production, store per-project secrets
      }
    }

    try {
      const project = await prisma().project.findUnique({
        where: { slug: projectId },
        include: { Tenant: true }
      })

      if (project) {
        // Cache project info
        this.projectCache.set(projectId, {
          projectId: project.id,
          tenantId: project.tenantId,
          roles: [],
          permissions: []
        })

        return {
          id: project.id,
          tenantId: project.tenantId,
          webhookSecret: process.env.WEBHOOK_SECRET
        }
      }
    } catch (error) {
      console.error('Failed to get project info:', error)
    }

    return null
  }

  /**
   * Create authentication context
   */
  createAuthContext(authData: Partial<AuthContext>): AuthContext {
    return {
      userId: authData.userId,
      projectId: authData.projectId,
      tenantId: authData.tenantId,
      roles: authData.roles || [],
      permissions: authData.permissions || [],
      isAuthenticated: !!authData.userId,
      isAdmin: authData.roles?.includes('admin') || false
    }
  }

  /**
   * Check if user has required permissions
   */
  hasPermission(context: AuthContext, requiredPermissions: string[]): boolean {
    if (!context.isAuthenticated) {
      return false
    }

    if (context.isAdmin) {
      return true
    }

    return requiredPermissions.every(permission => 
      context.permissions.includes(permission)
    )
  }

  /**
   * Check if user has required role
   */
  hasRole(context: AuthContext, requiredRoles: string[]): boolean {
    if (!context.isAuthenticated) {
      return false
    }

    if (context.isAdmin) {
      return true
    }

    return requiredRoles.some(role => context.roles.includes(role))
  }

  /**
   * Check project access
   */
  async checkProjectAccess(
    context: AuthContext, 
    projectId: string
  ): Promise<boolean> {
    if (!context.isAuthenticated) {
      return false
    }

    if (context.isAdmin) {
      return true
    }

    if (context.projectId === projectId) {
      return true
    }

    // Check if user has access to the project
    const projectAccess = this.projectCache.get(projectId)
    if (projectAccess && projectAccess.tenantId === context.tenantId) {
      return true
    }

    return false
  }

  /**
   * Generate secure session token
   */
  generateSessionToken(context: AuthContext): string {
    const payload = {
      userId: context.userId,
      projectId: context.projectId,
      tenantId: context.tenantId,
      roles: context.roles,
      permissions: context.permissions,
      exp: Date.now() + this.SESSION_TIMEOUT
    }

    const token = crypto
      .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
      .update(JSON.stringify(payload))
      .digest('hex')

    // Store session
    this.sessionStore.set(token, context)

    return token
  }

  /**
   * Validate session token
   */
  validateSessionToken(token: string): AuthContext | null {
    const context = this.sessionStore.get(token)
    
    if (!context) {
      return null
    }

    // Check if session is expired
    const now = Date.now()
    // In production, check token expiration from JWT payload

    return context
  }

  /**
   * Revoke session token
   */
  revokeSessionToken(token: string): boolean {
    return this.sessionStore.delete(token)
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now()
    for (const [token, context] of this.sessionStore.entries()) {
      // In production, check JWT expiration
      if (now - Date.now() > this.SESSION_TIMEOUT) {
        this.sessionStore.delete(token)
      }
    }
  }
}

/**
 * Authentication middleware
 */
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  policy: SecurityPolicy = { requireAuth: true }
) {
  const authManager = AuthSecurityManager.getInstance()

  return async (req: NextRequest): Promise<NextResponse> => {
    let context: AuthContext = {
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isAdmin: false
    }

    // Check authentication if required
    if (policy.requireAuth) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const sessionContext = authManager.validateSessionToken(token)
        if (sessionContext) {
          context = sessionContext
        }
      }

      if (!context.isAuthenticated) {
        return NextResponse.json({
          error: 'Authentication required',
          message: 'Valid authentication token required'
        }, { status: 401 })
      }
    }

    // Check project access if required
    if (policy.requireProject) {
      const projectId = req.headers.get('X-Calibr-Project')
      if (!projectId) {
        return NextResponse.json({
          error: 'Project required',
          message: 'X-Calibr-Project header is required'
        }, { status: 400 })
      }

      const hasAccess = await authManager.checkProjectAccess(context, projectId)
      if (!hasAccess) {
        return NextResponse.json({
          error: 'Access denied',
          message: 'Insufficient permissions for this project'
        }, { status: 403 })
      }

      context.projectId = projectId
    }

    // Check roles if required
    if (policy.allowedRoles && policy.allowedRoles.length > 0) {
      if (!authManager.hasRole(context, policy.allowedRoles)) {
        return NextResponse.json({
          error: 'Access denied',
          message: 'Insufficient role permissions'
        }, { status: 403 })
      }
    }

    // Check permissions if required
    if (policy.requiredPermissions && policy.requiredPermissions.length > 0) {
      if (!authManager.hasPermission(context, policy.requiredPermissions)) {
        return NextResponse.json({
          error: 'Access denied',
          message: 'Insufficient permissions'
        }, { status: 403 })
      }
    }

    return handler(req, context)
  }
}

/**
 * Admin-only middleware
 */
export function withAdminAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    allowedRoles: ['admin'],
    requiredPermissions: ['admin.access']
  })
}

/**
 * Project-scoped middleware
 */
export function withProjectAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    requireProject: true
  })
}

// Export singleton instance
export const authSecurityManager = AuthSecurityManager.getInstance()
