"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Badge } from '@calibr/ui';

interface ShopifyIntegration {
  id: string;
  platform: string;
  platformName: string;
  status: string;
  connectedAt: string;
  lastSyncAt?: string;
  syncStatus?: string;
  syncError?: string;
}

interface SyncLog {
  id: string;
  syncType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  itemsProcessed?: number;
  itemsSuccessful?: number;
  itemsFailed?: number;
  errors?: string[];
}

export default function ShopifyIntegrationPage() {
  const params = useParams() as { slug: string };
  const [integration, setIntegration] = useState<ShopifyIntegration | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      const response = await fetch(`/api/platforms/shopify/sync/status?projectId=${params.slug}`);
      const data = await response.json();
      
      if (data.success) {
        setIntegration(data.integration);
        setSyncLogs(data.syncLogs);
      }
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (syncType: string = 'full') => {
    setSyncing(true);
    try {
      const response = await fetch('/api/platforms/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.slug,
          syncType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload status after sync
        await loadIntegrationStatus();
        alert(`Sync completed: ${data.message}`);
      } else {
        alert(`Sync failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'success';
      case 'DISCONNECTED': return 'danger';
      case 'ERROR': return 'danger';
      default: return 'warning';
    }
  };

  const getSyncStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'ERROR': return 'danger';
      case 'SYNCING': return 'warning';
      case 'PARTIAL': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopify Integration</h1>
          <p className="text-gray-600 mt-1">
            Manage your Shopify store connection and product synchronization
          </p>
        </div>
        {integration?.status === 'CONNECTED' && (
          <div className="flex space-x-2">
            <Button
              variant="primary"
              onClick={() => handleSync('incremental')}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Recent'}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSync('full')}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Full Sync'}
            </Button>
          </div>
        )}
      </div>

      {/* Integration Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        
        {integration ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{integration.platformName}</h3>
                <p className="text-sm text-gray-600">
                  Connected on {new Date(integration.connectedAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(integration.status)}>
                {integration.status}
              </Badge>
            </div>

            {integration.lastSyncAt && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Last Sync</p>
                  <p className="text-sm text-gray-600">
                    {new Date(integration.lastSyncAt).toLocaleString()}
                  </p>
                </div>
                {integration.syncStatus && (
                  <Badge variant={getSyncStatusBadgeVariant(integration.syncStatus)}>
                    {integration.syncStatus}
                  </Badge>
                )}
              </div>
            )}

            {integration.syncError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Sync Error:</strong> {integration.syncError}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No Shopify integration found</p>
            <Button
              variant="primary"
              onClick={() => window.location.href = `/p/${params.slug}/integrations/shopify/install`}
            >
              Connect Shopify Store
            </Button>
          </div>
        )}
      </Card>

      {/* Sync History */}
      {integration && syncLogs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sync History</h2>
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSyncStatusBadgeVariant(log.status)}>
                      {log.status}
                    </Badge>
                    <span className="text-sm font-medium">{log.syncType} sync</span>
                    <span className="text-sm text-gray-600">
                      {new Date(log.startedAt).toLocaleString()}
                    </span>
                  </div>
                  {log.itemsProcessed && (
                    <p className="text-sm text-gray-600 mt-1">
                      Processed: {log.itemsSuccessful || 0}/{log.itemsProcessed} items
                      {log.itemsFailed && log.itemsFailed > 0 && (
                        <span className="text-red-600"> ({log.itemsFailed} failed)</span>
                      )}
                    </p>
                  )}
                  {log.errors && log.errors.length > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Errors: {log.errors.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      {integration?.status === 'CONNECTED' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              onClick={() => window.open(`/api/platforms/shopify/products?projectId=${params.slug}`, '_blank')}
            >
              View Products
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSync('products')}
              disabled={syncing}
            >
              Sync Products Only
            </Button>
            <Button
              variant="primary"
              onClick={() => window.location.href = `/p/${params.slug}/integrations/shopify/install`}
            >
              Reconnect Store
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
