'use client'

import { useState } from 'react'

type NoticeType = 'success' | 'error' | 'info' | 'warning'

export function Notice({ type = 'info', message, onClose }: { type?: NoticeType; message: string; onClose?: () => void }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  const color =
    type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'
  return (
    <div className={`mb-4 rounded-md border border-${color}-200 bg-${color}-50 p-4 text-${color}-800`}>
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm">{message}</div>
        <button
          className={`text-${color}-800/70 hover:text-${color}-900 text-sm`}
          onClick={() => {
            setOpen(false)
            onClose?.()
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

