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
  integration: { status?: string; platformName?: string; lastSyncAt?: string | null; syncStatus?: string | null } | null
  projectSlug: string
  onUpdate?: () => void
}

export function PlatformCard({ platform, integration, projectSlug, onUpdate }: PlatformCardProps) {
  const [syncing, setSyncing] = useState(false)
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

  const isConnected = integration?.status === 'CONNECTED'
  const platformUrl = `/p/${projectSlug}/integrations/${platform.platform}`

  return (
    <>
      <div className="bg-surface rounded-lg shadow-sm border-2 border-border overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-bg flex items-center justify-center">
              <span className="text-2xl">
                {platform.platform === 'shopify' && '🛍️'}
                {platform.platform === 'amazon' && '📦'}
                {platform.platform === 'google_shopping' && '🔍'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-fg">{platform.name}</h3>
              {integration && (
                <p className="text-sm text-mute mt-0.5">{integration.platformName}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {isConnected ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg text-mute border border-border">
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
            <div className="text-sm text-mute space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-fg">{integration.status}</span>
              </div>
              {integration.lastSyncAt && (
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="font-medium text-fg">
                    {new Date(integration.lastSyncAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {integration.syncStatus && (
                <div className="flex justify-between">
                  <span>Sync Status:</span>
                  <span className="font-medium text-fg">{integration.syncStatus}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Link
                href={platformUrl}
                className="flex-1 text-center bg-brand text-white px-3 py-2 rounded-md hover:bg-brand/90 transition-colors text-sm font-medium shadow-sm"
              >
                Manage
              </Link>
              <button
                onClick={handleSync}
                disabled={syncing || integration.syncStatus === 'SYNCING'}
                className="flex-1 bg-accent text-white px-3 py-2 rounded-md hover:bg-accent/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {syncing || integration.syncStatus === 'SYNCING' ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-2 border-2 border-border text-fg rounded-md hover:bg-bg transition-colors text-sm font-medium"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-mute">
              Connect your {platform.name} store to sync products and manage pricing.
            </p>
            <Link
              href={platformUrl}
              className="block w-full text-center bg-brand text-white px-4 py-2 rounded-md hover:bg-brand/90 transition-colors font-medium shadow-sm"
            >
              Connect {platform.name}
            </Link>
          </div>
        )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && integration && (
        <PlatformSettings
          platform={{ ...platform, description: platform.description || '' }}
          integration={{
            id: (integration as { id?: string }).id || '',
            status: integration.status || 'UNKNOWN',
            platformName: integration.platformName || '',
            connectedAt: new Date().toISOString(),
            lastSyncAt: integration.lastSyncAt,
            syncStatus: integration.syncStatus,
            platform: platform.platform,
            isActive: true
          }}
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
