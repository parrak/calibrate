'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import { platformsApi } from '@/lib/api-client'
import { PlatformCard } from '@/components/platforms/PlatformCard'
import { IntegrationStats } from '@/components/platforms/IntegrationStats'
import { SyncHistoryViewer } from '@/components/platforms/SyncHistoryViewer'

interface Platform {
  platform: string
  name: string
  description?: string
  available: boolean
}

interface Integration {
  id: string
  platform: string
  platformName: string
  status: string
  lastSyncAt?: string | null
  syncStatus?: string | null | undefined
}

export default function IntegrationsPage({ params }: { params: { slug: string } }) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get available platforms
      const { platforms: availablePlatforms } = await platformsApi.list()
      setPlatforms(availablePlatforms as unknown as Platform[])

      // Get integration status for each platform
      const integrationData: Record<string, Integration> = {}
      await Promise.all(
        availablePlatforms.map(async (platformRaw) => {
          try {
            const platform = platformRaw as unknown as Platform
            const { integration } = await platformsApi.getStatus(
              platform.platform,
              params.slug
            )
            if (integration) {
              integrationData[platform.platform] = integration as unknown as Integration
            }
          } catch (err: unknown) {
            // Platform not connected, that's OK
            console.log(`Platform ${(platformRaw as unknown as Platform).platform} not connected:`, err)
          }
        })
      )

      setIntegrations(integrationData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load integrations'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params.slug])

  const allIntegrations = Object.values(integrations) as Integration[]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect and manage your e-commerce platforms
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadData}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <IntegrationStats integrations={allIntegrations} loading={loading} />

      {/* Platform Cards */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Available Platforms
        </h2>

        {loading && platforms.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map(platform => (
              <PlatformCard
                key={platform.platform}
                platform={platform}
                integration={integrations[platform.platform] || null}
                projectSlug={params.slug}
                onUpdate={loadData}
              />
            ))}
          </div>
        )}

        {!loading && platforms.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <span className="text-4xl mb-4 block">🔌</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No platforms available
            </h3>
            <p className="text-gray-500">
              Check back later for new platform integrations.
            </p>
          </div>
        )}
      </div>

      {/* Recent Sync Activity */}
      {allIntegrations.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Sync Activity</h2>

          {/* Show sync history for the first connected integration */}
          {allIntegrations.filter(i => i.status === 'CONNECTED').length > 0 && (
            <div className="space-y-4 mb-6">
              {allIntegrations
                .filter(i => i.status === 'CONNECTED')
                .slice(0, 1)
                .map((integration) => (
                  <div key={integration.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-xl">
                          {integration.platform === 'shopify' && '🛍️'}
                          {integration.platform === 'amazon' && '📦'}
                          {integration.platform === 'google_shopping' && '🔍'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.platformName}</h3>
                        <p className="text-sm text-gray-500">
                          {integration.platform.charAt(0).toUpperCase() + integration.platform.slice(1)}
                        </p>
                      </div>
                    </div>
                    <SyncHistoryViewer
                      platform={integration.platform}
                      integrationId={integration.id}
                      projectSlug={params.slug}
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Integration Status Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Integration Status</h3>
            <div className="space-y-3">
              {allIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-xl">
                        {integration.platform === 'shopify' && '🛍️'}
                        {integration.platform === 'amazon' && '📦'}
                        {integration.platform === 'google_shopping' && '🔍'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.platformName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {integration.lastSyncAt
                          ? `Last synced ${new Date(integration.lastSyncAt).toLocaleString()}`
                          : 'Never synced'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {integration.syncStatus === 'SUCCESS' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Success
                      </span>
                    )}
                    {integration.syncStatus === 'SYNCING' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ⟳ Syncing
                      </span>
                    )}
                    {integration.syncStatus === 'ERROR' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠ Error
                      </span>
                    )}
                    {!integration.syncStatus && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        – Idle
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
