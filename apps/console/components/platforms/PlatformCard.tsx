'use client'

import Link from 'next/link'
import { useState } from 'react'
import { platformsApi } from '@/lib/api-client'
import { PlatformSettings } from './PlatformSettings'

interface PlatformCardProps {
  platform: {
    platform: string
    name: string
    description?: string
    available: boolean
  }
  integration: any | null
  projectSlug: string
  onUpdate?: () => void
}

export function PlatformCard({ platform, integration, projectSlug, onUpdate }: PlatformCardProps) {
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleSync = async () => {
    try {
      setSyncing(true)
      await platformsApi.triggerSync(platform.platform, projectSlug)
      onUpdate?.()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect from ${platform.name}?`)) return

    try {
      setDisconnecting(true)
      await platformsApi.disconnect(platform.platform, projectSlug)
      onUpdate?.()
    } catch (error) {
      console.error('Disconnect failed:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  const isConnected = integration?.status === 'CONNECTED'
  const platformUrl = `/p/${projectSlug}/integrations/${platform.platform}`

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">
                {platform.platform === 'shopify' && '🛍️'}
                {platform.platform === 'amazon' && '📦'}
                {platform.platform === 'google_shopping' && '🔍'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{platform.name}</h3>
              {integration && (
                <p className="text-sm text-gray-500 mt-0.5">{integration.platformName}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {isConnected ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {isConnected ? (
          <div className="space-y-3">
            {/* Connection Info */}
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-gray-900">{integration.status}</span>
              </div>
              {integration.lastSyncAt && (
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(integration.lastSyncAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {integration.syncStatus && (
                <div className="flex justify-between">
                  <span>Sync Status:</span>
                  <span className="font-medium text-gray-900">{integration.syncStatus}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Link
                href={platformUrl}
                className="flex-1 text-center bg-gray-900 text-white px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Manage
              </Link>
              <button
                onClick={handleSync}
                disabled={syncing || integration.syncStatus === 'SYNCING'}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing || integration.syncStatus === 'SYNCING' ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Connect your {platform.name} store to sync products and manage pricing.
            </p>
            <Link
              href={platformUrl}
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Connect {platform.name}
            </Link>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <PlatformSettings
          platform={{ ...platform, description: platform.description || '' }}
          integration={integration}
          projectSlug={projectSlug}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            onUpdate?.()
            setShowSettings(false)
          }}
        />
      )}
    </>
  )
}
