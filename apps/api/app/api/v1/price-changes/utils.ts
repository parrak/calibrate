import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma, ProjectRole, type Membership, type PriceChange, type Project } from '@calibr/db'
import { authSecurityManager, type AuthContext } from '@/lib/auth-security'

export type ConnectorState = 'QUEUED' | 'SYNCING' | 'SYNCED' | 'ERROR'
export type PriceChangeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'APPLIED'
  | 'REJECTED'
  | 'FAILED'
  | 'ROLLED_BACK'
export type PolicyCheck = { name: string; ok: boolean; [k: string]: unknown }

export type PriceChangeDTO = {
  id: string
  status: PriceChangeStatus
  currency: string
  fromAmount: number
  toAmount: number
  createdAt: string
  source?: string
  context?: Record<string, unknown>
  policyResult?: { ok: boolean; checks: PolicyCheck[] }
  approvedBy?: string | null
  appliedAt?: string | null
  connectorStatus?: {
    target: 'shopify' | 'amazon' | string
    state: ConnectorState
    errorMessage?: string | null
    variantId?: string | null
    externalId?: string | null
    updatedAt?: string | null
  }
}

export type ApiErrorShape = {
  status: number
  error: string
  message?: string
  details?: Record<string, unknown>
}

const ROLE_ORDER: Record<ProjectRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

function roleSatisfies(role: ProjectRole, minRole: ProjectRole) {
  return ROLE_ORDER[role] >= ROLE_ORDER[minRole]
}

export async function requireProjectAccess(
  req: NextRequest,
  projectSlug: string,
  minRole: ProjectRole = 'VIEWER'
): Promise<
  | {
      session: AuthContext
      project: Project
      membership: Membership
    }
  | { error: ApiErrorShape }
> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: { status: 401, error: 'Unauthorized', message: 'Missing bearer token' } }
  }

  const token = authHeader.substring(7).trim()
  const session = authSecurityManager.validateSessionToken(token)
  if (!session || !session.userId) {
    return { error: { status: 401, error: 'Unauthorized', message: 'Invalid session token' } }
  }

  const project = await prisma().project.findUnique({ where: { slug: projectSlug } })
  if (!project) {
    return { error: { status: 404, error: 'NotFound', message: 'Project not found' } }
  }

  const membership = await prisma().membership.findUnique({
    where: {
      userId_projectId: {
        userId: session.userId,
        projectId: project.id,
      },
    },
  })

  if (!membership) {
    return { error: { status: 403, error: 'Forbidden', message: 'You need access to this project.' } }
  }

  if (!roleSatisfies(membership.role, minRole)) {
    return {
      error: {
        status: 403,
        error: 'Forbidden',
        message: `Requires ${minRole.toLowerCase()} or higher permissions.`,
      },
    }
  }

  return { session, project, membership }
}

export function errorJson(err: ApiErrorShape) {
  const body: Record<string, unknown> = { ok: false, error: err.error }
  if (err.message) body.message = err.message
  if (typeof err.details !== 'undefined') body.details = err.details
  return NextResponse.json(body, { status: err.status })
}

export function toPriceChangeDTO(pc: PriceChange): PriceChangeDTO {
  // Convert context to Record<string, unknown> if it exists
  let context: Record<string, unknown> | undefined = undefined
  if (pc.context) {
    if (typeof pc.context === 'object' && pc.context !== null && !Array.isArray(pc.context)) {
      context = pc.context as Record<string, unknown>
    }
  }

  // Convert policyResult, handling null
  let policyResult: { ok: boolean; checks: PolicyCheck[] } | undefined = undefined
  if (pc.policyResult) {
    const result = pc.policyResult as { ok: boolean; checks: PolicyCheck[] } | null
    if (result) {
      policyResult = result
    }
  }

  return {
    id: pc.id,
    status: pc.status as PriceChangeStatus,
    currency: pc.currency,
    fromAmount: pc.fromAmount,
    toAmount: pc.toAmount,
    createdAt: pc.createdAt.toISOString(),
    source: pc.source ?? undefined,
    context,
    policyResult,
    approvedBy: pc.approvedBy,
    appliedAt: pc.appliedAt ? pc.appliedAt.toISOString() : null,
    connectorStatus: normalizeConnectorStatus(pc.connectorStatus),
  }
}

function extractString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  return null
}

function normalizeConnectorStatus(raw: unknown) {
  if (!raw || typeof raw !== 'object') return undefined

  const rawObj = raw as Record<string, unknown>
  const target = typeof rawObj.target === 'string' ? rawObj.target : undefined
  const state = typeof rawObj.state === 'string' ? (rawObj.state as ConnectorState) : undefined
  if (!target || !state) return undefined

  const errorMessage =
    typeof rawObj.errorMessage === 'string'
      ? rawObj.errorMessage
      : rawObj.errorMessage === null
      ? null
      : typeof rawObj.message === 'string'
      ? rawObj.message
      : undefined

  const metadata = rawObj.metadata && typeof rawObj.metadata === 'object' ? (rawObj.metadata as Record<string, unknown>) : undefined
  const variantId =
    extractString(rawObj.variantId) ?? extractString(metadata?.variantId) ?? extractString(metadata?.externalId)
  const externalId = extractString(rawObj.externalId) ?? extractString(metadata?.externalId)
  const updatedAt = extractString(rawObj.updatedAt)

  return {
    target,
    state,
    errorMessage: typeof errorMessage === 'undefined' ? null : errorMessage,
    variantId: typeof variantId === 'undefined' ? null : variantId,
    externalId: typeof externalId === 'undefined' ? null : externalId,
    updatedAt: typeof updatedAt === 'undefined' ? null : updatedAt,
  }
}

export function inferConnectorTarget(pc: PriceChange): string {
  const connectorStatus = pc.connectorStatus as { target?: string } | null | undefined
  const fromStatus = connectorStatus?.target
  if (typeof fromStatus === 'string' && fromStatus.length) {
    return fromStatus
  }
  const contextObj = pc.context as { target?: string } | null | undefined
  const contextTarget = contextObj?.target
  if (typeof contextTarget === 'string' && contextTarget.length) {
    return contextTarget
  }
  return 'shopify'
}

export async function getPCForProject(id: string, projectSlug: string) {
  const pc = await prisma().priceChange.findUnique({ where: { id } })
  if (!pc) return { error: 'NotFound' as const }
  const project = await prisma().project.findUnique({ where: { id: pc.projectId } })
  if (!project || project.slug !== projectSlug) return { error: 'Forbidden' as const }
  return { pc, project }
}

export function resolveShopifyVariantId(pc: PriceChange): string | null {
  const tryValue = (value: unknown): string | null => extractString(value)

  const ctx = (pc.context ?? undefined) as Record<string, unknown> | undefined
  if (ctx) {
    const directKeys = [
      'shopifyVariantId',
      'variantId',
      'connectorVariantId',
      'externalVariantId',
      'shopify_variant_id',
    ]
    for (const key of directKeys) {
      const value = ctx[key]
      const resolved = tryValue(value)
      if (resolved) return resolved
    }

    const nestedShopify = ctx.shopify
    if (nestedShopify && typeof nestedShopify === 'object') {
      const resolved = tryValue((nestedShopify as Record<string, unknown>).variantId)
      if (resolved) return resolved
    }
  }

  const connectorStatus = pc.connectorStatus as Prisma.JsonValue | null | undefined
  if (connectorStatus && typeof connectorStatus === 'object' && connectorStatus !== null) {
    const statusObj = connectorStatus as Record<string, unknown>
    const direct = tryValue(statusObj.variantId)
    if (direct) return direct

    const metadata = statusObj.metadata
    if (metadata && typeof metadata === 'object') {
      const resolved =
        tryValue((metadata as Record<string, unknown>).variantId) ??
        tryValue((metadata as Record<string, unknown>).externalId)
      if (resolved) return resolved
    }
  }

  return null
}

export async function getActiveShopifyIntegration(projectId: string) {
  return prisma().shopifyIntegration.findFirst({
    where: { projectId, isActive: true },
  })
}
