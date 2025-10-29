'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  id?: string
  type?: ToastType
  durationMs?: number
}

interface ToastItem {
  id: string
  message: string
  type: ToastType
  expiresAt?: number
}

interface ToastContextValue {
  show: (message: string, opts?: ToastOptions) => string
  success: (message: string, opts?: Omit<ToastOptions, 'type'>) => string
  error: (message: string, opts?: Omit<ToastOptions, 'type'>) => string
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const show = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = opts?.id || Math.random().toString(36).slice(2)
      const type: ToastType = opts?.type || 'info'
      const duration = opts?.durationMs ?? 3500
      const expiresAt = duration > 0 ? Date.now() + duration : undefined
      setToasts((t) => [...t, { id, message, type, expiresAt }])
      return id
    },
    [],
  )

  const success = useCallback((message: string, opts?: Omit<ToastOptions, 'type'>) => show(message, { ...opts, type: 'success' }), [show])
  const error = useCallback((message: string, opts?: Omit<ToastOptions, 'type'>) => show(message, { ...opts, type: 'error' }), [show])

  // Auto-prune expired
  useEffect(() => {
    const i = setInterval(() => {
      const now = Date.now()
      setToasts((t) => t.filter((x) => !x.expiresAt || x.expiresAt > now))
    }, 1000)
    return () => clearInterval(i)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ show, success, error, remove }), [show, success, error, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            `min-w-[260px] max-w-[360px] rounded-md px-4 py-3 shadow ` +
            (t.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : t.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : t.type === 'warning'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800')
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm leading-5">{t.message}</div>
            <button
              className="text-sm opacity-70 hover:opacity-100"
              onClick={() => onClose(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

