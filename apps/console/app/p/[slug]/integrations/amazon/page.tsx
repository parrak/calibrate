'use client'

import { useState, useEffect } from 'react'
import { platformsApi } from '@/lib/api-client'
import Link from 'next/link'
import { Notice } from '@/components/Notice'
import { useToast } from '@/components/Toast'
import { DisconnectConfirm } from '@/components/DisconnectConfirm'

interface AmazonIntegration {
  id: string
  platformName: string
  status: string
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: string | null
  syncError: string | null
  connectedAt: string
}

interface AmazonIntegrationPageProps {
  params: {
    slug: string
  }
}

export default function AmazonIntegrationPage({ params }: AmazonIntegrationPageProps) {
  const [integration, setIntegration] = useState<AmazonIntegration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    fetchIntegration()
    // Detect callback success or error query params
    try {
      const q = new URLSearchParams(window.location.search)
      if (q.get('connected') === '1') {
        toast.success('Amazon account connected successfully.')
        // Clean up query param in URL without reloading
        const url = new URL(window.location.href)
        url.searchParams.delete('connected')
        window.history.replaceState({}, '', url.toString())
        // Refresh status to reflect new connection
        fetchIntegration()
      }
      const err = q.get('error')
      if (err) {
        setError(err)
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        window.history.replaceState({}, '', url.toString())
      }
    } catch (error) {
      console.error('Error parsing query params:', error)
    }
  }, [params.slug])

  const fetchIntegration = async () => {
    try {
      setLoading(true)
      const { integration: integrationData } = await platformsApi.getStatus('amazon', params.slug)
      setIntegration(integrationData as AmazonIntegration | null)
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
        // Not connected, that's OK
        setIntegration(null)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch integration status')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setConnecting(true)
      const base = process.env.NEXT_PUBLIC_API_BASE || ''
      const res = await fetch(`${base}/api/platforms/amazon/oauth/install?project=${encodeURIComponent(params.slug)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Failed to start Amazon OAuth (${res.status})`)
      }
      const data = await res.json()
      const installUrl = data?.installUrl as string | undefined
      if (!installUrl) throw new Error('Install URL not returned from API')
      window.location.href = installUrl
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to start Amazon connection')
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Error Loading Integration
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchIntegration}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isConnected = integration?.status === 'CONNECTED'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notice && <Notice type="success" message={notice} onClose={() => setNotice(null)} />}
        {error && !loading && <Notice type="error" message={error} onClose={() => setError(null)} />}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Amazon Integration</h1>
          <p className="mt-2 text-gray-600">
            Connect your Amazon Seller account to automate pricing updates
          </p>
        </div>

        {/* Integration Status */}
        {isConnected ? (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <DisconnectConfirm projectSlug={params.slug} platform="amazon" onDone={fetchIntegration} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Platform Name</p>
                  <p className="text-sm font-medium text-gray-900">{integration.platformName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Connected</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(integration.connectedAt).toLocaleDateString()}
                  </p>
                </div>
                {integration.lastSyncAt && (
                  <div>
                    <p className="text-sm text-gray-500">Last Sync</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(integration.lastSyncAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {integration.syncStatus && (
                  <div>
                    <p className="text-sm text-gray-500">Sync Status</p>
                    <p className="text-sm font-medium text-gray-900">{integration.syncStatus}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amazon Tools</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href={`/p/${params.slug}/integrations/amazon/pricing`}
                  className="block border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing Feed</h3>
                  <p className="text-gray-600">Submit price feeds and poll feed status</p>
                </Link>

                <Link
                  href={`/p/${params.slug}/integrations/amazon/competitive`}
                  className="block border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Competitive Pricing
                  </h3>
                  <p className="text-gray-600">Track Buy Box and offer prices for ASINs</p>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Connect Your Amazon Seller Account
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Connect your Amazon Seller Central account via SP-API credentials to start syncing
                products and managing pricing. You'll need to provide your seller ID, marketplace
                ID, and API credentials.
              </p>

              <div className="mb-8">
                <div className="grid md:grid-cols-3 gap-6 mb-6 text-left">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">🔑</div>
                    <h3 className="font-semibold text-gray-900 mb-1">SP-API Credentials</h3>
                    <p className="text-sm text-gray-600">
                      Provide your seller ID, client ID, and refresh token
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">🌍</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Marketplace Selection</h3>
                    <p className="text-sm text-gray-600">
                      Choose your marketplace (US, EU, etc.)
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl mb-2">📦</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Catalog Import</h3>
                    <p className="text-sm text-gray-600">
                      Automatically sync your product catalog
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? 'Connecting...' : 'Connect Amazon'}
              </button>

              <p className="text-sm text-gray-500 mt-4">
                Need help?{' '}
                <a
                  href="https://developer-docs.amazon.com/sp-api/docs/registering-your-application"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  View setup guide →
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Catalog Sync</h3>
              </div>
              <p className="text-gray-600">
                Automatically sync products and variants from your Amazon Seller account.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Price Feed Updates</h3>
              </div>
              <p className="text-gray-600">
                Submit price feeds to Amazon SP-API and track their status in real-time.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Competitive Analysis</h3>
              </div>
              <p className="text-gray-600">
                Track Buy Box prices and competitor offers for better pricing decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
