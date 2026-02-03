import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as applyRunRoute } from '../app/api/v1/runs/[runId]/apply/route'
import { authSecurityManager } from '@/lib/auth-security'

type StoreState = {
  projects: Array<{ id: string; slug: string; tenantId: string }>
  memberships: Array<{ userId: string; projectId: string; role: string }>
  ruleRuns: Array<{ id: string; projectId: string; tenantId: string; status: string }>
  ruleTargets: Array<{ id: string; ruleRunId: string }>
}

const initialState = (): StoreState => ({
  projects: [{ id: 'proj1', slug: 'demo', tenantId: 'tenant1' }],
  memberships: [
    { userId: 'admin1', projectId: 'proj1', role: 'ADMIN' },
    { userId: 'viewer1', projectId: 'proj1', role: 'VIEWER' },
  ],
  ruleRuns: [{ id: 'run1', projectId: 'proj1', tenantId: 'tenant1', status: 'PREVIEW' }],
  ruleTargets: [{ id: 'target1', ruleRunId: 'run1' }],
})

const store = (() => {
  let state = initialState()
  const clone = <T,>(value: T): T => structuredClone(value)

  const client = {
    project: {
      findUnique: async ({ where }: { where: { slug?: string } }) => {
        const project = state.projects.find((p) => p.slug === where.slug)
        return project ? clone(project) : null
      },
    },
    membership: {
      findUnique: async ({
        where,
      }: {
        where: { userId_projectId: { userId: string; projectId: string } }
      }) => {
        const membership = state.memberships.find(
          (m) => m.userId === where.userId_projectId.userId && m.projectId === where.userId_projectId.projectId
        )
        return membership ? clone(membership) : null
      },
    },
    ruleRun: {
      findFirst: async ({
        where,
        select,
      }: {
        where: { id: string; projectId: string; tenantId: string }
        select: { id: boolean; status: boolean; RuleTarget: { select: { id: boolean }; take: number } }
      }) => {
        const run = state.ruleRuns.find(
          (r) => r.id === where.id && r.projectId === where.projectId && r.tenantId === where.tenantId
        )
        if (!run) return null
        const targets = state.ruleTargets.filter((t) => t.ruleRunId === run.id).slice(0, select.RuleTarget.take)
        return {
          id: run.id,
          status: run.status,
          RuleTarget: targets.map((t) => ({ id: t.id })),
        }
      },
    },
  }

  return {
    get state() {
      return state
    },
    client,
    reset() {
      state = initialState()
    },
  }
})()

const worker = {
  queueRun: vi.fn().mockResolvedValue(undefined),
  getRunStatus: vi.fn().mockResolvedValue({ status: 'QUEUED' }),
}

vi.mock('@calibr/db', () => ({
  prisma: () => store.client,
}))

vi.mock('@calibr/automation-runner', () => ({
  getRulesWorker: () => worker,
}))

const makeRequest = (url: string, token?: string) =>
  new NextRequest(
    new Request(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  )

const createToken = (userId: string) =>
  authSecurityManager.generateSessionToken(
    authSecurityManager.createAuthContext({
      userId,
      roles: ['admin'],
    })
  )

describe('runs apply API', () => {
  beforeEach(() => {
    store.reset()
    worker.queueRun.mockClear()
    worker.getRunStatus.mockClear()
  })

  it('queues a preview run for application', async () => {
    const token = createToken('admin1')
    const req = makeRequest('http://localhost/api/v1/runs/run1/apply?project=demo', token)
    const res = await applyRunRoute(req, { params: { runId: 'run1' } })
    expect(res.status).toBe(200)
    expect(worker.queueRun).toHaveBeenCalledWith('run1')
  })

  it('rejects non-admin users', async () => {
    const token = createToken('viewer1')
    const req = makeRequest('http://localhost/api/v1/runs/run1/apply?project=demo', token)
    const res = await applyRunRoute(req, { params: { runId: 'run1' } })
    expect(res.status).toBe(403)
  })
})
