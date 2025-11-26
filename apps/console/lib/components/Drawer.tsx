'use client'
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type Props = { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; width?: number }
export function Drawer({ open, onClose, title, children }: Props) {
  const drawerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Keyboard navigation: Escape key to close
  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Focus management: trap focus in drawer when open
  useEffect(() => {
    if (!open) return
    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement
    // Focus drawer when it opens
    const timer = setTimeout(() => {
      drawerRef.current?.focus()
    }, 100)
    return () => {
      clearTimeout(timer)
      // Restore focus when drawer closes
      previousFocusRef.current?.focus()
    }
  }, [open])

  if (typeof document === 'undefined') return null
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity opacity-100"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full bg-surface border-l border-border shadow-2xl transition-transform pointer-events-auto w-full md:w-auto"
        style={{ width: '100%', maxWidth: '100vw', transform: 'translateX(0)' }}
        aria-labelledby="drawer-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <div id="drawer-title" className="font-semibold text-fg">{title}</div>
          <button
            onClick={onClose}
            className="text-mute hover:text-fg transition-colors p-1"
            aria-label="Close drawer"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-49px)] p-4 bg-surface">{children}</div>
      </aside>
    </div>,
    document.body
  )
}
