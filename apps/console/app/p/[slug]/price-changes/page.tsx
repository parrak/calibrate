'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import clsx from 'clsx'
import { Button, Drawer, DiffCard, EmptyState, PolicyList, StatusPill, useToast } from '@/lib/components'
import { SimpleTable as Table } from '@/lib/components/SimpleTable'
import { AIExplanation } from './components/AIExplanation'

type ConnectorState = 'QUEUED' | 'SYNCING' | 'SYNCED' | 'ERROR'
type PriceChangeStatus = 'PENDING' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'FAILED' | 'ROLLED_BACK'
type ProjectRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'
type PolicyCheck = { name: string; ok: boolean; [k: string]: unknown }
type ConnectorStatus = {
  target: string
  state: ConnectorState
  errorMessage?: string | null
  variantId?: string | null
  externalId?: string | null
  updatedAt?: string | null
}

type PriceChangeDTO = {
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
  connectorStatus?: ConnectorStatus
}

type FilterStatus = PriceChangeStatus | 'ALL'

const STATUS_OPTIONS: Array<{ label: string; value: FilterStatus; color: string }> = [
  { label: 'Pending', value: 'PENDING', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { label: 'Approved', value: 'APPROVED', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Applied', value: 'APPLIED', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Rejected', value: 'REJECTED', color: 'bg-gray-600 hover:bg-gray-700' },
  { label: 'Failed', value: 'FAILED', color: 'bg-red-600 hover:bg-red-700' },
  { label: 'Rolled Back', value: 'ROLLED_BACK', color: 'bg-orange-600 hover:bg-orange-700' },
  { label: 'All', value: 'ALL', color: 'bg-zinc-700 hover:bg-zinc-800' },
]

const ROLE_WEIGHT: Record<ProjectRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

const CONNECTOR_COLOR: Record<ConnectorState, string> = {
  QUEUED: 'bg-zinc-800 text-zinc-200',
  SYNCING: 'bg-blue-900/60 text-blue-200',
  SYNCED: 'bg-emerald-900/60 text-emerald-200',
  ERROR: 'bg-red-900/60 text-red-200',
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

const formatCurrency = (currency: string, amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)

const pctDelta = (fromAmount: number, toAmount: number) => {
  if (!fromAmount) return null
  const delta = toAmount - fromAmount
  return (delta / fromAmount) * 100
}

const makeKey = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export default function PriceChangesPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { data: session } = useSession()
  const { Toast, setMsg } = useToast()

  const globalRole = (session?.user?.role || '').toUpperCase()
  const fallbackRole: ProjectRole =
    globalRole === 'OWNER' ? 'OWNER' : globalRole === 'ADMIN' ? 'ADMIN' : 'VIEWER'

  const token = (session as { apiToken?: string })?.apiToken

  const [status, setStatus] = useState<FilterStatus>('PENDING')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [items, setItems] = useState<PriceChangeDTO[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const cursorRef = useRef<string | undefined>()
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | undefined>()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<PriceChangeDTO | null>(null)
  const [role, setRole] = useState<ProjectRole>(fallbackRole)

  useEffect(() => {
    setRole(fallbackRole)
  }, [fallbackRole])

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!active) return
    const current = items.find((it) => it.id === active.id)
    if (current && current !== active) {
      setActive(current)
    }
  }, [items, active])

  const load = useCallback(
    async ({ reset, cursor: cursorOverride }: { reset?: boolean; cursor?: string | undefined } = {}) => {
      if (loadingRef.current) return

      loadingRef.current = true
      setLoading(true)
      if (reset) {
        setItems([])
        setCursor(undefined)
        cursorRef.current = undefined
      }

      try {
        const params = new URLSearchParams({ project: slug })
        const statusParam = status
        if (statusParam && statusParam !== 'ALL') {
          params.set('status', statusParam)
        }
        if (debouncedQ) {
          params.set('q', debouncedQ)
        }
        const cursorToUse = reset ? undefined : cursorOverride ?? cursorRef.current
        if (cursorToUse) {
          params.set('cursor', cursorToUse)
        }

        const res = await fetch(`${API_BASE}/api/v1/price-changes?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const message = data?.message || data?.error || `Failed with status ${res.status}`

          // For cursor errors, just stop pagination instead of showing error
          if (res.status === 400 && message.includes('cursor')) {
            setCursor(undefined)
            cursorRef.current = undefined
            return
          }

          // For auth errors, show helpful message
          if (res.status === 401) {
            setError('Authentication failed. Please sign out and sign in again.')
            setItems([])
            setCursor(undefined)
            cursorRef.current = undefined
            return
          }

          if (reset) {
            setItems([])
            setCursor(undefined)
            cursorRef.current = undefined
          }
          setError(message)
          setMsg(`Failed to load price changes: ${message}`)
          return
        }

        const incoming: PriceChangeDTO[] = Array.isArray(data?.items) ? data.items : []
        setRole((data?.role as ProjectRole) || fallbackRole)
        setCursor(data?.nextCursor ?? undefined)
        cursorRef.current = data?.nextCursor ?? undefined
        setItems((prev) => (reset ? incoming : [...prev, ...incoming]))
        setError(null)
      } catch (err: unknown) {
        if (reset) {
          setItems([])
          setCursor(undefined)
          cursorRef.current = undefined
        }
        const message = err instanceof Error ? err.message : 'Unexpected error'
        setError(message)
        setMsg(`Failed to load price changes: ${message}`)
      } finally {
        setLoading(false)
        loadingRef.current = false
        setInitialized(true)
      }
    },
    [slug, status, debouncedQ, token, fallbackRole, setMsg]
  )

  useEffect(() => {
    load({ reset: true })
  }, [load])

  const canEdit = useMemo(() => ROLE_WEIGHT[role] >= ROLE_WEIGHT.EDITOR, [role])
  const canApply = useMemo(() => ROLE_WEIGHT[role] >= ROLE_WEIGHT.ADMIN, [role])

  const handleAct = useCallback(
    async (id: string, op: 'approve' | 'apply' | 'reject' | 'rollback') => {
      if (busyId) return
      setBusyId(id)
      try {
        const res = await fetch(`${API_BASE}/api/v1/price-changes/${id}/${op}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Calibr-Project': slug,
            'Idempotency-Key': makeKey(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.ok === false) {
          const message = data?.message || data?.error || `Failed with status ${res.status}`
          setMsg(`Failed: ${message}`)
          return
        }
        const updated: PriceChangeDTO | undefined = data?.item
        if (updated) {
          setItems((prev) => prev.map((it) => (it.id === id ? updated : it)))
          if (active?.id === id) {
            setActive(updated)
          }
        }
        const successMessage =
          op === 'apply'
            ? 'Price applied'
            : op === 'rollback'
            ? 'Rolled back'
            : op === 'reject'
            ? 'Rejected'
            : 'Approved'
        setMsg(successMessage)
      } catch (err: unknown) {
        setMsg(`Failed: ${err instanceof Error ? err.message : 'Unexpected error'}`)
      } finally {
        setBusyId(undefined)
      }
    },
    [active, busyId, slug, token, setMsg]
  )

  const connectorBadge = (status?: ConnectorStatus) => {
    if (!status) return <span className="text-xs text-mute">-</span>
    return (
      <span className={clsx('px-2 py-0.5 rounded text-xs', CONNECTOR_COLOR[status.state])}>
        {status.target} - {status.state}
      </span>
    )
  }

  const renderActions = (item: PriceChangeDTO) => {
    const isBusy = busyId === item.id
    const canApproveAction = canEdit && item.status === 'PENDING'
    const canApplyAction =
      canApply &&
      (item.status === 'APPROVED' || (item.status === 'PENDING' && item.policyResult?.ok))
    const canRejectAction = canEdit && item.status !== 'REJECTED' && item.status !== 'ROLLED_BACK'
    const canRollbackAction = canApply && item.status === 'APPLIED'

    return (
      <div className="flex flex-wrap gap-2">
        {canApproveAction && (
          <Button
            variant="ghost"
            disabled={isBusy}
            onClick={(ev) => {
              ev.stopPropagation()
              handleAct(item.id, 'approve')
            }}
          >
            Approve
          </Button>
        )}
        {canApplyAction && (
          <Button
            variant="primary"
            disabled={isBusy}
            onClick={(ev) => {
              ev.stopPropagation()
              handleAct(item.id, 'apply')
            }}
          >
            Apply
          </Button>
        )}
        {canRollbackAction && (
          <Button
            variant="ghost"
            disabled={isBusy}
            onClick={(ev) => {
              ev.stopPropagation()
              handleAct(item.id, 'rollback')
            }}
          >
            Rollback
          </Button>
        )}
        {canRejectAction && (
          <Button
            variant="danger"
            disabled={isBusy}
            onClick={(ev) => {
              ev.stopPropagation()
              handleAct(item.id, 'reject')
            }}
          >
            Reject
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={(ev) => {
            ev.stopPropagation()
            setActive(item)
            setOpen(true)
          }}
        >
          Details
        </Button>
      </div>
    )
  }

  const drawerActions = active ? renderActions(active) : null

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Price Changes</h1>
          <p className="text-sm text-mute">
            Review, approve, and apply suggested price updates for project <span className="font-mono">{slug}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={clsx(
                'rounded-full px-3 py-1 text-sm font-medium transition',
                status === option.value
                  ? `${option.color} text-white`
                  : 'bg-surface/50 border border-border text-mute hover:bg-surface hover:text-fg'
              )}
              onClick={() => {
                if (status === option.value) return
                setStatus(option.value)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {/* Workflow Guidance Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-xl shrink-0" aria-hidden="true">ℹ️</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-100 mb-1">Two-Step Approval Process</h3>
            <p className="text-xs text-blue-200">
              Price changes require two separate actions: <strong>Approve</strong> (review and validate) → <strong>Apply</strong> (sync to platform).
              Approved changes are NOT automatically applied — you must explicitly click "Apply" to push changes live.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="w-full sm:w-64 rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Search by SKU or source..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-xs text-mute">
            Role: <span className="font-medium text-fg">{role}</span>
          </div>
        </div>

        {!initialized && loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-mute/40" />
            ))}
          </div>
        )}

        {initialized && items.length === 0 && !loading && !error && (
          <EmptyState
            title="No price changes yet"
            desc="When Calibr generates new price suggestions you'll see them here."
          />
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <div className="font-medium mb-1">{error}</div>
            {error.includes('Authentication failed') && (
              <div className="text-xs text-red-300 mt-2">
                This usually means the API authentication token is missing or invalid.
                Please ensure CONSOLE_INTERNAL_TOKEN is configured correctly in both Console and API environments.
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <Table
            head={
              <tr className="text-left text-xs uppercase tracking-wide text-mute">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">% Δ</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Connector</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            }
          >
            {items.map((item) => {
              const delta = item.toAmount - item.fromAmount
              const pct = pctDelta(item.fromAmount, item.toAmount)
              const pctClass =
                pct === null ? 'text-mute' : delta >= 0 ? 'text-emerald-400' : 'text-red-400'

              return (
                <tr
                  key={item.id}
                  className="cursor-pointer border-b border-border/60 text-sm transition hover:bg-mute/20"
                  onClick={() => {
                    setActive(item)
                    setOpen(true)
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {(item.context?.skuCode as string | undefined) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{formatCurrency(item.currency, item.fromAmount)}</span>
                      <span className="text-xs text-mute">
                        → {formatCurrency(item.currency, item.toAmount)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {pct === null ? (
                      <span className="text-xs text-mute">—</span>
                    ) : (
                      <span className={clsx('text-xs font-medium', pctClass)}>
                        {delta >= 0 ? '+' : ''}
                        {pct.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <span className="text-mute">{item.source || '—'}</span>
                      {item.policyResult?.checks && (
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand/20 text-brand text-[10px] cursor-help"
                          title={`AI Rationale: ${item.policyResult.checks
                            .filter((c) => c.ok)
                            .map((c) => c.name)
                            .join(', ') || 'Click for details'}`}
                        >
                          ?
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="px-4 py-3">{connectorBadge(item.connectorStatus)}</td>
                  <td className="px-4 py-3">{renderActions(item)}</td>
                </tr>
              )
            })}
          </Table>
        )}

        {cursor && (
          <div className="flex justify-center">
            <Button variant="ghost" disabled={loading} onClick={() => load({ cursor })}>
              {loading ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>

      <Drawer
        open={open && !!active}
        onClose={() => setOpen(false)}
        title={
          active ? (
            <div className="flex items-center gap-2">
              <span>Price Change</span>
              <span className="font-mono text-xs text-mute">{active.id}</span>
              <StatusPill status={active.status} />
            </div>
          ) : null
        }
        width={520}
      >
        {active && (
          <div className="space-y-4">
            <DiffCard
              currency={active.currency}
              fromAmount={active.fromAmount}
              toAmount={active.toAmount}
            />

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xs text-mute">Source</div>
                <div className="font-medium">{active.source ?? '—'}</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xs text-mute">Created</div>
                <div>{new Date(active.createdAt).toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xs text-mute">Approved By</div>
                <div>{active.approvedBy ?? '—'}</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xs text-mute">Applied At</div>
                <div>{active.appliedAt ? new Date(active.appliedAt).toLocaleString() : '—'}</div>
              </div>
            </div>

            {active.connectorStatus && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-mute">Connector</div>
                  {connectorBadge(active.connectorStatus)}
                </div>
                {active.connectorStatus.errorMessage && (
                  <div className="mt-2 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {active.connectorStatus.errorMessage}
                  </div>
                )}
              </div>
            )}

            <PolicyList checks={active.policyResult?.checks ?? []} />

            <AIExplanation
              priceChangeId={active.id}
              skuCode={(active.context?.skuCode as string | undefined) || undefined}
              fromAmount={active.fromAmount}
              toAmount={active.toAmount}
              currency={active.currency}
              projectSlug={slug}
              token={token}
            />

            <div>
              <div className="mb-2 text-sm font-medium">Context</div>
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-sm">
                {active.context && Object.keys(active.context).length > 0 ? (
                  Object.entries(active.context).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-xs text-mute capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <span className="font-medium">
                        {typeof value === 'object' && value !== null
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-mute">No context data available</span>
                )}
              </div>
            </div>

            {active.connectorStatus?.state === 'ERROR' && canApply && (
              <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Connector reported an error. Retry applying to re-queue the sync.
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">{drawerActions}</div>
          </div>
        )}
      </Drawer>

      {Toast}
    </div>
  )
}

