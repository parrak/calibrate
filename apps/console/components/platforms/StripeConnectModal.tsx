'use client'

import { useState } from 'react'
import { useToast } from '@/lib/components'

interface StripeConnectModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    projectSlug: string
}

export function StripeConnectModal({ isOpen, onClose, onSuccess, projectSlug }: StripeConnectModalProps) {
    const [apiKey, setApiKey] = useState('')
    const [loading, setLoading] = useState(false)
    const { Toast, setMsg } = useToast()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // First get project ID from slug (or pass it down if available, but slug is what we have)
            // Actually, the API expects projectId. We might need to fetch it or use slug if API supports it.
            // The connect route expects projectId.
            // We can fetch the project first or update the API to accept slug.
            // Let's assume we need to fetch the project ID or use a helper.
            // For now, let's try to fetch the project details to get the ID.

            // Wait, let's check if we can pass projectId to PlatformCard.
            // PlatformCard receives projectSlug.
            // We can fetch the project ID via an API call or assume the backend can handle slug?
            // The connect route `apps/api/app/api/integrations/stripe/connect/route.ts` expects `projectId`.
            // I should update the route to accept `projectSlug` as well or look it up.
            // But for now, let's fetch the project ID in the component or use a specialized endpoint.

            // Actually, `platformsApi` in `lib/api-client` might have a helper.
            // Let's check `lib/api-client` first.

            // Assuming we have an endpoint to get project by slug.
            const projectRes = await fetch(`/api/projects/${projectSlug}`)
            if (!projectRes.ok) throw new Error('Failed to fetch project details')
            const project = await projectRes.json()
            const projectId = project.id

            const res = await fetch('/api/integrations/stripe/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, apiKey }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to connect Stripe')
            }

            setMsg('Stripe connected successfully')
            setTimeout(() => {
                onSuccess()
                onClose()
            }, 1000)

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Connection failed'
            setMsg(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface p-6 rounded-lg shadow-lg max-w-md w-full border border-border">
                <h2 className="text-xl font-semibold mb-4 text-fg">Connect Stripe</h2>
                <p className="text-sm text-mute mb-4">
                    Enter your Stripe Secret Key (starts with <code>sk_</code> or <code>rk_</code>).
                    We recommend using a Restricted Key with read-only access to Products, Prices, and Charges.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-fg mb-1">Secret Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md bg-bg text-fg focus:ring-2 focus:ring-brand focus:border-transparent"
                            placeholder="sk_..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-fg hover:bg-bg rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand/90 rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                </form>
                {Toast}
            </div>
        </div>
    )
}
