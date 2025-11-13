'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button, Drawer, EmptyState, StatusPill, useToast, Tabs, TabsList, TabsTrigger, TabsContent } from '@/lib/components'
import { ResponsiveTable } from '@/lib/components/ResponsiveTable'
import { JSONView } from '@/lib/components/JSONView'
import { AuditTrail } from '@/lib/components/AuditTrail'

type RuleRunStatus = 'PREVIEW' | 'QUEUED' | 'APPLYING' | 'APPLIED' | 'FAILED' | 'ROLLED_BACK'

type RuleRunDTO = {
  id: string
  status: RuleRunStatus
  ruleId: string
  scheduledFor: string | null
  startedAt: string | null
  finishedAt: string | null
  explainJson: Record<string, unknown> | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  PricingRule: {
    id: string
    name: string
  }
  targetCounts: {
    QUEUED: number
    APPLIED: number
    FAILED: number
    PREVIEW: number
    ROLLED_BACK: number
  }
  totalTargets: number
}

type RunDetailDTO = RuleRunDTO & {
  PricingRule: {
    id: string
    name: string
    transformJson: Record<string, unknown>
  }
  RuleTarget: Array<{
    id: string
    productId: string
    variantId: string | null
    beforeJson: Record<string, unknown>
    afterJson: Record<string, unknown>
    status: string
    errorMessage: string | null
    createdAt: string
  }>
  auditEvents: Array<{
    id: string
    action: string
    actor: string
    explain: Record<string, unknown>
    createdAt: string
  }>
}

type ProgressDTO = {
  runId: string
  status: RuleRunStatus
  progress: number
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  targetCounts: {
    QUEUED: number
    APPLIED: number
    FAILED: number
    PREVIEW: number
    ROLLED_BACK: number
  }
  totalTargets: number
  completed: number
}

type FilterStatus = RuleRunStatus | 'ALL'

const STATUS_OPTIONS: Array<{ label: string; value: FilterStatus; color: string }> = [
  { label: 'Preview', value: 'PREVIEW', color: 'bg-gray-600 hover:bg-gray-700' },
  { label: 'Queued', value: 'QUEUED', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { label: 'Applying', value: 'APPLYING', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Applied', value: 'APPLIED', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Failed', value: 'FAILED', color: 'bg-red-600 hover:bg-red-700' },
  { label: 'Rolled Back', value: 'ROLLED_BACK', color: 'bg-orange-600 hover:bg-orange-700' },
  { label: 'All', value: 'ALL', color: 'bg-zinc-700 hover:bg-zinc-800' },
]

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

export default function AutomationRunsPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { data: session } = useSession()
  const { Toast, setMsg } = useToast()

  const [status, setStatus] = useState<FilterStatus>('ALL')
  const [items, setItems] = useState<RuleRunDTO[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<RunDetailDTO | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<Map<string, ProgressDTO>>(new Map())
  const progressIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const token = (session as { apiToken?: string })?.apiToken

  // Fetch runs
  const fetchRuns = useCallback(async (reset = false) => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        project: slug,
        ...(status !== 'ALL' && { status }),
        ...(cursor && !reset && { cursor }),
      })

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/v1/runs?${params}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch runs: ${response.statusText}`)
      }

      const data = await response.json()
      if (reset) {
        setItems(data.items || [])
      } else {
        setItems((prev) => [...prev, ...(data.items || [])])
      }
      setCursor(data.nextCursor || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch runs')
      setMsg(`Error: ${err instanceof Error ? err.message : 'Failed to fetch runs'}`)
    } finally {
      setLoading(false)
    }
  }, [slug, status, cursor, loading, token, setMsg])

  // Fetch run details
  const fetchRunDetails = useCallback(async (runId: string) => {
    try {
      const params = new URLSearchParams({ project: slug })
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/v1/runs/${runId}?${params}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch run details: ${response.statusText}`)
      }

      const data = await response.json()
      setSelectedRun(data)
      setDrawerOpen(true)
    } catch (err) {
      setMsg(`Error: ${err instanceof Error ? err.message : 'Failed to fetch run details'}`)
    }
  }, [slug, token, setMsg])

  // Poll progress for active runs
  const pollProgress = useCallback((runId: string) => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams({ project: slug })
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE}/api/v1/runs/${runId}/progress?${params}`, { headers })
        if (!response.ok) return

        const data: ProgressDTO = await response.json()
        setProgressData((prev) => {
          const next = new Map(prev)
          next.set(runId, data)
          return next
        })

        // Stop polling if run is finished
        if (['APPLIED', 'FAILED', 'ROLLED_BACK'].includes(data.status)) {
          clearInterval(interval)
          progressIntervals.current.delete(runId)
        }
      } catch (err) {
        console.error('Error polling progress:', err)
      }
    }, 2000) // Poll every 2 seconds

    progressIntervals.current.set(runId, interval)
  }, [slug, token])

  // Retry failed targets
  const handleRetryFailed = useCallback(async (runId: string) => {
    setRetrying(runId)
    try {
      const params = new URLSearchParams({ project: slug })
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/v1/runs/${runId}/retry-failed?${params}`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to retry: ${response.statusText}`)
      }

      const data = await response.json()
      setMsg(`Retried ${data.retriedCount} failed targets`)

      // Refresh runs list
      await fetchRuns(true)

      // Start polling progress
      pollProgress(runId)
    } catch (err) {
      setMsg(`Error: ${err instanceof Error ? err.message : 'Failed to retry'}`)
    } finally {
      setRetrying(null)
    }
  }, [slug, token, setMsg, fetchRuns, pollProgress])

  // Initial fetch
  useEffect(() => {
    fetchRuns(true)
  }, [status, fetchRuns])

  // Start polling for active runs
  useEffect(() => {
    items.forEach((item) => {
      if (['QUEUED', 'APPLYING'].includes(item.status) && !progressIntervals.current.has(item.id)) {
        pollProgress(item.id)
      }
    })
  }, [items, pollProgress])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      progressIntervals.current.forEach((interval) => clearInterval(interval))
    }
  }, [])

  // Show toast for status changes
  useEffect(() => {
    items.forEach((item) => {
      const progress = progressData.get(item.id)
      if (progress) {
        if (progress.status === 'APPLIED') {
          setMsg(`Run "${item.PricingRule.name}" completed successfully`)
        } else if (progress.status === 'FAILED') {
          setMsg(`Run "${item.PricingRule.name}" failed`)
        }
      }
    })
  }, [progressData, items, setMsg])

  const columns = useMemo(
    () => [
      {
        key: 'rule',
        header: 'Rule',
        render: (item: RuleRunDTO) => (
          <div>
            <div className="font-medium text-fg">{item.PricingRule.name}</div>
            <div className="text-xs text-mute">ID: {item.id.slice(0, 8)}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (item: RuleRunDTO) => {
          const progress = progressData.get(item.id)
          const displayStatus = progress?.status || item.status
          return (
            <div className="space-y-1">
              <StatusPill status={displayStatus} />
              {progress && ['QUEUED', 'APPLYING'].includes(displayStatus) && (
                <div className="text-xs text-mute">
                  {progress.progress}% ({progress.completed}/{progress.totalTargets})
                </div>
              )}
            </div>
          )
        },
      },
      {
        key: 'targets',
        header: 'Targets',
        render: (item: RuleRunDTO) => {
          const progress = progressData.get(item.id)
          const counts = progress?.targetCounts || item.targetCounts
          return (
            <div className="text-sm">
              <div className="font-medium">{item.totalTargets} total</div>
              <div className="text-xs text-mute space-x-2">
                <span className="text-emerald-600">{counts.APPLIED} applied</span>
                {counts.FAILED > 0 && <span className="text-red-600">{counts.FAILED} failed</span>}
                {counts.QUEUED > 0 && <span className="text-yellow-600">{counts.QUEUED} queued</span>}
              </div>
            </div>
          )
        },
      },
      {
        key: 'created',
        header: 'Created',
        render: (item: RuleRunDTO) => formatDate(item.createdAt),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (item: RuleRunDTO) => {
          const progress = progressData.get(item.id)
          const displayStatus = progress?.status || item.status
          const hasFailed = (progress?.targetCounts || item.targetCounts).FAILED > 0
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRunDetails(item.id)}
              >
                View
              </Button>
              {hasFailed && displayStatus !== 'APPLYING' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRetryFailed(item.id)}
                  disabled={retrying === item.id}
                >
                  {retrying === item.id ? 'Retrying...' : 'Retry Failed'}
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [progressData, fetchRunDetails, handleRetryFailed, retrying]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Automation Runs</h1>
          <p className="text-sm text-mute mt-1">View and manage automated pricing rule executions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={status === option.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setStatus(option.value)
              setCursor(undefined)
            }}
            className={status === option.value ? option.color : ''}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <EmptyState
          title="No runs found"
          desc="Automation runs will appear here when rules are executed"
        />
      ) : (
        <>
          <ResponsiveTable
            columns={columns}
            data={items}
            keyExtractor={(item) => item.id}
            aria-label="Automation runs table"
          />

          {cursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchRuns(false)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedRun(null)
        }}
        title={selectedRun ? `Run: ${selectedRun.PricingRule.name}` : 'Run Details'}
      >
        {selectedRun && (
          <div className="space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="explain">Explain</TabsTrigger>
                <TabsTrigger value="targets">Targets</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-mute">Status</div>
                    <StatusPill status={selectedRun.status} />
                  </div>
                  <div>
                    <div className="text-sm text-mute">Total Targets</div>
                    <div className="font-medium">{selectedRun.totalTargets}</div>
                  </div>
                  <div>
                    <div className="text-sm text-mute">Created</div>
                    <div className="font-medium">{formatDate(selectedRun.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-mute">Started</div>
                    <div className="font-medium">{formatDate(selectedRun.startedAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-mute">Finished</div>
                    <div className="font-medium">{formatDate(selectedRun.finishedAt)}</div>
                  </div>
                  {selectedRun.errorMessage && (
                    <div className="col-span-2">
                      <div className="text-sm text-mute">Error</div>
                      <div className="text-sm text-red-600">{selectedRun.errorMessage}</div>
                    </div>
                  )}
                </div>

                {(selectedRun.targetCounts.FAILED > 0) && selectedRun.status !== 'APPLYING' && (
                  <Button
                    variant="outline"
                    onClick={() => handleRetryFailed(selectedRun.id)}
                    disabled={retrying === selectedRun.id}
                  >
                    {retrying === selectedRun.id ? 'Retrying...' : 'Retry Failed'}
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="explain" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Transform</h3>
                  <JSONView value={selectedRun.PricingRule.transformJson} />
                </div>
                {selectedRun.explainJson && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Explain Trace</h3>
                    <JSONView value={selectedRun.explainJson} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="targets" className="space-y-4">
                <div className="text-sm text-mute mb-4">
                  {selectedRun.RuleTarget.length} targets
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedRun.RuleTarget.map((target) => (
                    <div
                      key={target.id}
                      className="border border-border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Product: {target.productId}</div>
                        <StatusPill status={target.status} />
                      </div>
                      {target.variantId && (
                        <div className="text-xs text-mute">Variant: {target.variantId}</div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-mute">Before</div>
                          <JSONView value={target.beforeJson} />
                        </div>
                        <div>
                          <div className="text-mute">After</div>
                          <JSONView value={target.afterJson} />
                        </div>
                      </div>
                      {target.errorMessage && (
                        <div className="text-sm text-red-600">{target.errorMessage}</div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <AuditTrail
                  events={selectedRun.auditEvents.map((event) => ({
                    id: event.id,
                    timestamp: event.createdAt,
                    action: event.action,
                    actor: event.actor,
                    details: event.explain,
                  }))}
                  showDetails
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Drawer>

      {Toast}
    </div>
  )
}

