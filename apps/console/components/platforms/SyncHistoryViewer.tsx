'use client'

import { useState, useEffect } from 'react'
import { platformsApi } from '@/lib/api-client'

interface SyncLog {
  id: string
  syncType: string
  status: string
  startedAt: string
  completedAt: string | null
  itemsSynced: number
  itemsFailed: number
  errors: any
}

interface SyncHistoryViewerProps {
  platform: string
  integrationId: string
  projectSlug: string
}

export function SyncHistoryViewer({
  platform,
  integrationId,
  projectSlug,
}: SyncHistoryViewerProps) {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSyncHistory()
  }, [integrationId])

  const fetchSyncHistory = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call when endpoint exists
      // For now, use mock data
      const mockLogs: SyncLog[] = [
        {
          id: '1',
          syncType: 'full',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3500000).toISOString(),
          itemsSynced: 245,
          itemsFailed: 0,
          errors: null,
        },
        {
          id: '2',
          syncType: 'incremental',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          completedAt: new Date(Date.now() - 7100000).toISOString(),
          itemsSynced: 12,
          itemsFailed: 0,
          errors: null,
        },
        {
          id: '3',
          syncType: 'manual',
          status: 'PARTIAL',
          startedAt: new Date(Date.now() - 10800000).toISOString(),
          completedAt: new Date(Date.now() - 10600000).toISOString(),
          itemsSynced: 189,
          itemsFailed: 3,
          errors: null,
        },
      ]
      setLogs(mockLogs)
    } catch (err: any) {
      setError(err.message || 'Failed to load sync history')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'In progress...'
    const start = new Date(startedAt).getTime()
    const end = new Date(completedAt).getTime()
    const seconds = Math.floor((end - start) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; icon: string }> = {
      SUCCESS: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      ERROR: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
      PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
      SYNCING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄' },
    }
    const variant = variants[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❓' }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}
      >
        {variant.icon} {status}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      full: { label: 'Full Sync', color: 'bg-purple-100 text-purple-800' },
      incremental: { label: 'Incremental', color: 'bg-blue-100 text-blue-800' },
      manual: { label: 'Manual', color: 'bg-green-100 text-green-800' },
      scheduled: { label: 'Scheduled', color: 'bg-gray-100 text-gray-800' },
    }
    const typeInfo = types[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchSyncHistory}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
        >
          Try again
        </button>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sync history yet</h3>
        <p className="text-gray-500">
          Sync activities will appear here after your first sync
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getTypeBadge(log.syncType)}
                {getStatusBadge(log.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Started</p>
                  <p className="font-medium text-gray-900">
                    {new Date(log.startedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">
                    {formatDuration(log.startedAt, log.completedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Items Synced</p>
                  <p className="font-medium text-gray-900">{log.itemsSynced}</p>
                </div>
                <div>
                  <p className="text-gray-500">Failed</p>
                  <p className={`font-medium ${log.itemsFailed > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {log.itemsFailed}
                  </p>
                </div>
              </div>
            </div>

            {log.itemsFailed > 0 && (
              <div className="ml-4">
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                  View Errors
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {logs.length > 5 && (
        <div className="text-center pt-4">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all sync logs →
          </button>
        </div>
      )}
    </div>
  )
}

