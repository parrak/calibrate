"use client";

import { useState, useEffect } from 'react';
import { Badge, Card } from '@calibr/ui';

interface ShopifyStatusProps {
  projectId: string;
  refreshInterval?: number; // in milliseconds
}

interface IntegrationStatus {
  id: string;
  platform: string;
  platformName: string;
  status: string;
  connectedAt: string;
  lastSyncAt?: string;
  syncStatus?: string;
  syncError?: string;
}

export default function ShopifyStatus({ projectId, refreshInterval = 30000 }: ShopifyStatusProps) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      const response = await fetch(`/api/platforms/shopify/sync/status?projectId=${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.integration);
        setError('');
      } else {
        setError(data.message || 'Failed to load status');
      }
    } catch (error) {
      console.error('Failed to load Shopify status:', error);
      setError('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    if (refreshInterval > 0) {
      const interval = setInterval(loadStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [projectId, refreshInterval]);

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
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm">No Shopify integration found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{status.platformName}</h3>
            <p className="text-xs text-gray-600">
              Connected {new Date(status.connectedAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(status.status)}>
            {status.status}
          </Badge>
        </div>

        {/* Sync Status */}
        {status.lastSyncAt && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Last Sync</p>
              <p className="text-xs text-gray-600">
                {new Date(status.lastSyncAt).toLocaleString()}
              </p>
            </div>
            {status.syncStatus && (
              <Badge variant={getSyncStatusBadgeVariant(status.syncStatus)}>
                {status.syncStatus}
              </Badge>
            )}
          </div>
        )}

        {/* Error Message */}
        {status.syncError && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-800">
              <strong>Error:</strong> {status.syncError}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2 border-t">
          <button
            onClick={() => window.location.href = `/p/${projectId}/integrations/shopify`}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Manage
          </button>
          <button
            onClick={() => window.location.href = `/p/${projectId}/integrations/shopify/install`}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reconnect
          </button>
        </div>
      </div>
    </Card>
  );
}
