'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShopifyStatus } from './ShopifyStatus'
import { ShopifyAuthButton } from './ShopifyAuthButton'
import { DisconnectConfirm } from '@/components/DisconnectConfirm'
import { platformsApi, ApiError } from '@/lib/api-client'
import { useToast } from '@/components/Toast'

interface ShopifyIntegration {
  id: string
  shopDomain: string
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: string | null
  syncError: string | null
  installedAt: string
}

interface ShopifyIntegrationClientProps {
  projectSlug: string
  initialIntegration: ShopifyIntegration | null
  initialIsConnected: boolean
  initialSuccess?: boolean
  initialError?: string | null
}

export function ShopifyIntegrationClient({
  projectSlug,
  initialIntegration,
  initialIsConnected,
  initialSuccess = false,
  initialError = null,
}: ShopifyIntegrationClientProps) {
  const [integration, setIntegration] = useState<ShopifyIntegration | null>(initialIntegration)
  const [isConnected, setIsConnected] = useState(initialIsConnected)
  const [loading, setLoading] = useState(false)
  const [successVisible, setSuccessVisible] = useState(initialSuccess)
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError)
  const toast = useToast()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMounted = useRef(true)
  const refreshingRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    return () => {
      isMounted.current = false
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  const clearQueryParam = useCallback(
    (param: string) => {
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      if (!url.searchParams.has(param)) return
      url.searchParams.delete(param)
      const nextSearch = url.searchParams.toString()
      const nextPath = nextSearch ? `${url.pathname}?${nextSearch}` : url.pathname
      router.replace(nextPath, { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    if (initialSuccess) {
      toast.success('Shopify account connected successfully.')
      clearQueryParam('success')
    }
  }, [initialSuccess, toast, clearQueryParam])

  useEffect(() => {
    if (initialError) {
      toast.error(getErrorMessage(initialError))
      clearQueryParam('error')
    }
  }, [initialError, toast, clearQueryParam])

  const refreshStatus = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (refreshingRef.current) {
        return
      }

      refreshingRef.current = true
      const { silent = false } = options

      try {
        if (!silent) {
          setLoading(true)
        }

        const status = await platformsApi.getStatus('shopify', projectSlug)
        const nextIntegration = (status.integration as ShopifyIntegration | null) ?? null

        if (!isMounted.current) {
          return
        }

        setIntegration(nextIntegration)
        setIsConnected(Boolean(status.isConnected))

        if (status.isConnected) {
          setErrorMessage(null)
        }
      } catch (error) {
        if (!isMounted.current) {
          return
        }

        if (error instanceof ApiError && error.status === 404) {
          setIntegration(null)
          setIsConnected(false)
          if (!silent) {
            toast.info('Shopify integration not found for this project yet.')
          }
          return
        }

        console.error('Failed to refresh Shopify integration status:', error)
        if (!silent) {
          toast.error('Failed to refresh Shopify status. Please try again.')
        }
      } finally {
        refreshingRef.current = false
        if (isMounted.current && !silent) {
          setLoading(false)
        }
      }
    },
    [projectSlug, toast]
  )

  useEffect(() => {
    refreshStatus({ silent: true }).catch((error) => {
      console.error('Initial Shopify status refresh failed:', error)
    })
  }, [refreshStatus])

  useEffect(() => {
    const status = integration?.syncStatus
    const shouldPoll = status === 'in_progress' || status === 'SYNCING'

    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    if (shouldPoll) {
      pollingRef.current = setInterval(() => {
        refreshStatus({ silent: true }).catch((error) => {
          console.error('Polling Shopify status failed:', error)
        })
      }, 5000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [integration?.syncStatus, refreshStatus])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Shopify Integration</h1>
      <p className="text-gray-600 mb-8">
        Connect your Shopify store to sync products and manage pricing.
      </p>

      {successVisible && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start justify-between gap-4">
          <p className="text-green-800 font-medium">✓ Successfully connected to Shopify!</p>
          <button
            type="button"
            onClick={() => setSuccessVisible(false)}
            className="text-sm text-green-700 hover:text-green-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start justify-between gap-4">
          <p className="text-red-800 font-medium">Failed to connect: {getErrorMessage(errorMessage)}</p>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-sm text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {isConnected && integration ? (
        <div className="space-y-6">
          <ShopifyStatus
            integration={integration}
            projectSlug={projectSlug}
            onUpdate={(updated) => {
              setIntegration(updated)
            }}
          />

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex items-center gap-3">
              <DisconnectConfirm
                projectSlug={projectSlug}
                platform="shopify"
                onDone={async () => {
                  await refreshStatus()
                  setSuccessVisible(false)
                }}
              />
              {loading && <span className="text-sm text-gray-500">Updating status…</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Connect Your Store</h2>
          <p className="text-gray-600 mb-6">
            Authorize Calibr to access your Shopify store. You&apos;ll be redirected to Shopify to grant permissions.
          </p>
          <ShopifyAuthButton projectSlug={projectSlug} />
        </div>
      )}
    </div>
  )
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    missing_parameters: 'OAuth callback missing required parameters',
    configuration_error: 'Shopify app not properly configured',
    invalid_signature: 'Invalid request signature',
    token_exchange_failed: 'Failed to exchange authorization code',
    no_access_token: 'No access token received from Shopify',
    save_failed: 'Failed to save integration',
    unexpected_error: 'An unexpected error occurred',
  }
  return messages[error] || error
}
