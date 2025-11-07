'use client'
import React from 'react'
import { createPortal } from 'react-dom'

type Props = { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; width?: number }
export function Drawer({ open, onClose, title, children, width=460 }: Props) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full bg-surface border-l border-border shadow-xl transition-transform ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ width, transform: `translateX(${open ? 0 : width}px)` }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-medium">{title}</div>
          <button onClick={onClose} className="text-mute hover:text-fg">✕</button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-49px)] p-4">{children}</div>
      </aside>
    </div>,
    document.body
  )
}
