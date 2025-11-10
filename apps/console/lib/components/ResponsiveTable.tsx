'use client'
import React from 'react'
import { cn } from '../utils'

/**
 * ResponsiveTable - A table component that automatically switches to card layout on mobile
 *
 * On desktop: Renders as a standard table
 * On mobile (< 768px): Renders as cards with key-value pairs
 */
type Column<T> = {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  accessor?: (item: T) => string | number | React.ReactNode
  mobileLabel?: string // Custom label for mobile card view
}

type ResponsiveTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  className?: string
  emptyMessage?: string
  onRowClick?: (item: T) => void
  'aria-label'?: string
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  className,
  emptyMessage = 'No data available',
  onRowClick,
  'aria-label': ariaLabel,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-mute" role="status" aria-live="polite">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block border border-border rounded-xl overflow-hidden">
        <table
          className={cn('w-full text-sm', className)}
          aria-label={ariaLabel}
          role="table"
        >
          <thead className="bg-surface">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-mute uppercase tracking-wider"
                  scope="col"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => {
              const key = keyExtractor(item)
              return (
                <tr
                  key={key}
                  className={cn(
                    'hover:bg-surface/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                  role="row"
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onRowClick(item)
                    }
                  }}
                  aria-label={onRowClick ? `Row ${key}, click to view details` : undefined}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(item)
                      : col.accessor
                      ? col.accessor(item)
                      : (item[col.key] as React.ReactNode)
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-fg"
                        data-label={col.header}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3" role="list" aria-label={ariaLabel}>
        {data.map((item) => {
          const key = keyExtractor(item)
          return (
            <div
              key={key}
              role="listitem"
              className={cn(
                'bg-surface border border-border rounded-lg p-4 space-y-3',
                onRowClick && 'cursor-pointer hover:border-brand transition-colors'
              )}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onRowClick(item)
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick ? `Card ${key}, click to view details` : undefined}
            >
              {columns.map((col) => {
                const content = col.render
                  ? col.render(item)
                  : col.accessor
                  ? col.accessor(item)
                  : (item[col.key] as React.ReactNode)
                const label = col.mobileLabel || col.header
                return (
                  <div
                    key={col.key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <span className="text-xs font-medium text-mute uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm text-fg">{content}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}

