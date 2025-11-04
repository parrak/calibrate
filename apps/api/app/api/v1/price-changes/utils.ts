import { NextRequest, NextResponse } from 'next/server'
import { prisma, ProjectRole, type PriceChange, type Project, type Membership } from '@calibr/db'
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
  return {
    id: pc.id,
    status: pc.status as PriceChangeStatus,
    currency: pc.currency,
    fromAmount: pc.fromAmount,
    toAmount: pc.toAmount,
    createdAt: pc.createdAt.toISOString(),
    source: pc.source ?? undefined,
    context: pc.context ?? undefined,
    policyResult: pc.policyResult as { ok: boolean; checks: PolicyCheck[] } | null | undefined,
    approvedBy: pc.approvedBy,
    appliedAt: pc.appliedAt ? pc.appliedAt.toISOString() : null,
    connectorStatus: normalizeConnectorStatus(pc.connectorStatus),
  }
}

function normalizeConnectorStatus(raw: unknown) {
  if (!raw) return undefined
  const target = typeof raw.target === 'string' ? (raw.target as string) : undefined
  const state = typeof raw.state === 'string' ? (raw.state as ConnectorState) : undefined
  if (!target || !state) return undefined
  const errorMessage =
    typeof raw.errorMessage === 'string'
      ? raw.errorMessage
      : raw.errorMessage === null
      ? null
      : typeof raw.message === 'string'
      ? raw.message
      : undefined
  return {
    target,
    state,
    errorMessage: typeof errorMessage === 'undefined' ? null : errorMessage,
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
