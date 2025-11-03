'use client'

import { useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/components/Toast'

export function DisconnectConfirm({
  projectSlug,
  platform,
  className,
  onDone,
  label = 'Disconnect',
}: {
  projectSlug: string
  platform?: 'amazon' | 'shopify' | string
  className?: string
  onDone?: () => void
  label?: string
}) {
  const pathname = usePathname()
  const toast = useToast()
  const [open, setOpen] = useState(false)

  const resolvedPlatform = useMemo(() => {
    if (platform) return platform
    // Try to infer from pathname: /p/[slug]/integrations/{platform}
    if (!pathname) return ''
    const parts = pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => p === 'integrations')
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
    return ''
  }, [platform, pathname])

  const title = `Disconnect ${resolvedPlatform ? resolvedPlatform.charAt(0).toUpperCase() + resolvedPlatform.slice(1) : 'Platform'}?`
  const message = 'This will disable syncing and pricing updates until reconnected.'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'text-sm px-3 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50'}
      >
        {label}
      </button>
      <ConfirmModal
        open={open}
        title={title}
        message={message}
        confirmText="Disconnect"
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          try {
            setOpen(false)
            const base = process.env.NEXT_PUBLIC_API_BASE || ''
            const res = await fetch(`${base}/api/platforms/${encodeURIComponent(resolvedPlatform)}?project=${encodeURIComponent(projectSlug)}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to disconnect')
            toast.success(`${resolvedPlatform} integration disconnected.`)
            onDone?.()
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to disconnect')
          }
        }}
      />
    </>
  )
}

