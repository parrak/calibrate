import React from 'react'
import { Badge } from './Badge'

export type AuditEvent = {
  id: string
  timestamp: string
  action: string
  actor?: string
  details?: Record<string, unknown>
  status?: 'success' | 'error' | 'pending'
}

// Simple time ago formatter
function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

type AuditTrailProps = {
  events: AuditEvent[]
  showDetails?: boolean
}

export function AuditTrail({ events, showDetails = false }: AuditTrailProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No audit events recorded
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={event.id || idx} className="relative pl-6">
          {/* Timeline connector */}
          {idx < events.length - 1 && (
            <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
          )}

          {/* Event dot */}
          <div
            className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ${
              event.status === 'error'
                ? 'bg-red-500'
                : event.status === 'pending'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
          />

          {/* Event content */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{event.action}</span>
                  {event.status && (
                    <Badge
                      variant={
                        event.status === 'success'
                          ? 'success'
                          : event.status === 'error'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {event.status}
                    </Badge>
                  )}
                </div>

                {event.actor && (
                  <div className="text-xs text-gray-500">by {event.actor}</div>
                )}

                {showDetails && event.details && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 whitespace-nowrap">
                {timeAgo(event.timestamp)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
