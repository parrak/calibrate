'use client'
import React from 'react'
import { createPortal } from 'react-dom'

type Props = { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; width?: number }
export function Drawer({ open, onClose, title, children, width=460 }: Props) {
  if (typeof document === 'undefined') return null
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-auto">
      <div
        className="absolute inset-0 bg-fg/20 backdrop-blur-sm transition-opacity opacity-100"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 h-full bg-surface border-l border-border shadow-2xl transition-transform pointer-events-auto"
        style={{ width, transform: 'translateX(0)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <div className="font-semibold text-fg">{title}</div>
          <button onClick={onClose} className="text-mute hover:text-fg transition-colors p-1">✕</button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-49px)] p-4 bg-surface">{children}</div>
      </aside>
    </div>,
    document.body
  )
}
