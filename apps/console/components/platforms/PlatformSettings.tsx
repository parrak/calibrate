'use client'

import { useState } from 'react'
import { platformsApi } from '@/lib/api-client'

interface PlatformSettingsProps {
  platform: {
    platform: string
    name: string
    description: string
  }
  integration: { id: string; status: string; platformName: string; connectedAt: string; lastSyncAt?: string | null; syncStatus?: string | null; platform: string; isActive: boolean } | null
  projectSlug: string
  onClose: () => void
  onUpdate: () => void
}

export function PlatformSettings({
  platform,
  integration,
  projectSlug,
  onClose,
  onUpdate,
}: PlatformSettingsProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'sync' | 'advanced'>('credentials')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect from ${platform.name}?`)) return

    try {
      setLoading(true)
      setMessage(null)
      await platformsApi.disconnect(platform.platform, projectSlug)
      setMessage({ type: 'success', text: 'Disconnected successfully' })
      onUpdate()
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to disconnect' })
    } finally {
      setLoading(false)
    }
  }

  if (!integration) {
    return (
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{platform.name} Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Connect to {platform.name} to manage settings</p>
          </div>

          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔌</div>
              <p className="text-gray-600 mb-6">
                {platform.name} is not connected. Please connect to access settings.
              </p>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{platform.name} Settings</h2>
            <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            {(['credentials', 'sync', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Status</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-gray-900">{integration.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Platform Name:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {integration.platformName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Connected:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(integration.connectedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Credentials</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your credentials are securely stored and encrypted. To update your connection,
                  please disconnect and reconnect with new credentials.
                </p>

                {platform.platform === 'shopify' && (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Shopify uses OAuth authentication. To update your
                        connection, you'll need to reconnect through the OAuth flow.
                      </p>
                    </div>
                  </div>
                )}

                {platform.platform === 'amazon' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Amazon credentials are stored securely. If you need to
                        update your SP-API credentials, please disconnect and reconnect.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-red-600">Danger Zone</h3>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="text-sm text-red-800 mb-3">
                    Disconnecting will remove this integration and stop all automatic syncs. You can
                    reconnect at any time.
                  </p>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Disconnecting...' : `Disconnect from ${platform.name}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Settings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure how and when your data syncs with {platform.name}.
                </p>
              </div>

              {integration.lastSyncAt && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Sync:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(integration.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                  {integration.syncStatus && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sync Status:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {integration.syncStatus}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Coming soon:</strong> Configure automatic sync schedules, conflict
                  resolution, and sync notifications.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Settings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Additional configuration options for your {platform.name} integration.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Integration ID:</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">
                    {integration.id.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Platform:</span>
                  <span className="text-sm font-medium text-gray-900">{integration.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {integration.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Coming soon:</strong> Configure webhooks, API rate limits, and custom
                  sync mappings.
                </p>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 rounded-lg p-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

