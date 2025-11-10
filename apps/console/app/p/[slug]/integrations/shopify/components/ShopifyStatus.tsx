/**
 * Shopify Status Component
 * Displays integration status and connection information
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button } from '@calibr/ui';
import { platformsApi } from '@/lib/api-client';
import { useToast } from '@/components/Toast';

interface ShopifyIntegration {
  id: string;
  shopDomain: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  installedAt: string;
}

interface ShopifyStatusProps {
  integration: ShopifyIntegration;
  projectSlug?: string;
  onUpdate?: (integration: ShopifyIntegration) => void;
}

interface ShopifyConnectionTestResponse {
  result?: {
    connected?: boolean;
    status?: {
      message?: string;
    };
  };
}

export function ShopifyStatus({ integration, projectSlug, onUpdate }: ShopifyStatusProps) {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<ShopifyIntegration>(integration);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollErrorRef = useRef<string | null>(null);
  const toast = useToast();

  // Sync prop changes to local state
  useEffect(() => {
    setCurrentIntegration(integration);
  }, [integration]);

  // Poll for live status updates when sync is in progress
  useEffect(() => {
    const isSyncing = currentIntegration.syncStatus === 'SYNCING' || currentIntegration.syncStatus === 'in_progress';

    if (isSyncing && projectSlug) {
      // Clear any existing poller before creating a new one
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll every 3 seconds when sync is active
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const data = await platformsApi.getSyncStatus('shopify', projectSlug);
          if (data.integration) {
            const updated: ShopifyIntegration = {
              ...currentIntegration,
              syncStatus: data.integration.syncStatus,
              lastSyncAt: data.integration.lastSyncAt,
              syncError: data.integration.syncError,
            };
            setCurrentIntegration(updated);
            if (onUpdate) {
              onUpdate(updated);
            }
            lastPollErrorRef.current = null;
          }
        } catch (err) {
          console.error('Failed to poll sync status:', err);
          const message = err instanceof Error ? err.message : 'Unable to refresh sync status';
          if (lastPollErrorRef.current !== message) {
            toast.error('Failed to refresh Shopify sync status.');
            lastPollErrorRef.current = message;
          }
        }
      }, 3000);
    } else {
      // Clear polling when no active sync
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentIntegration.syncStatus, projectSlug, onUpdate, toast]);

  const handleSync = async () => {
    if (!projectSlug) {
      toast.error('Project slug is required to start a sync.');
      return;
    }

    try {
      setSyncing(true);
      await platformsApi.triggerSync('shopify', projectSlug, 'full');

      const updated: ShopifyIntegration = {
        ...currentIntegration,
        syncStatus: 'in_progress',
        syncError: null,
      };
      setCurrentIntegration(updated);

      if (onUpdate) {
        onUpdate(updated);
      }

      toast.success('Shopify sync started. We’ll update the status shortly.');
    } catch (error) {
      console.error('Sync error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Sync operation failed';
      const updated: ShopifyIntegration = {
        ...currentIntegration,
        syncStatus: 'error',
        syncError: errorMessage,
      };
      setCurrentIntegration(updated);

      if (onUpdate) {
        onUpdate(updated);
      }

      toast.error(`Failed to start Shopify sync: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);

      if (!projectSlug) {
        throw new Error('Project slug is required for connection test');
      }

      const data = await platformsApi.triggerSync<ShopifyConnectionTestResponse>(
        'shopify',
        projectSlug,
        'test_connection',
      );

      const result = data?.result;

      // Update local state
      const updated = {
        ...currentIntegration,
        syncStatus: result?.connected ? 'success' : 'error',
        syncError: result?.connected ? null : result?.status?.message || 'Connection failed',
        lastSyncAt: new Date().toISOString(),
      };
      setCurrentIntegration(updated);

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updated);
      }

      if (updated.syncStatus === 'success') {
        toast.success('Shopify connection verified successfully.');
      } else {
        toast.error(updated.syncError || 'Connection test failed');
      }

    } catch (error) {
      console.error('Connection test error:', error);

      let errorMessage = 'Connection test failed';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error: Cannot reach the Calibr API. Please verify connectivity.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const updated = {
        ...currentIntegration,
        syncStatus: 'error',
        syncError: errorMessage,
      };
      setCurrentIntegration(updated);

      if (onUpdate) {
        onUpdate(updated);
      }

      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!currentIntegration.isActive) {
      return <Badge variant="danger">Inactive</Badge>;
    }

    switch (currentIntegration.syncStatus) {
      case 'success':
        return <Badge variant="primary">Connected</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      case 'in_progress':
      case 'SYNCING':
      case 'pending':
        return <Badge variant="primary">Syncing</Badge>;
      case null:
        return <Badge>Idle</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Integration Status
        </h2>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Connection Details
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Store:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {currentIntegration.shopDomain}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Installed:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {formatDate(currentIntegration.installedAt)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Last Sync:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {formatDate(currentIntegration.lastSyncAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Actions
          </h3>
          <div className="space-y-2">
            <Button
              onClick={handleSync}
              disabled={syncing || currentIntegration.syncStatus === 'SYNCING' || currentIntegration.syncStatus === 'in_progress'}
              variant="primary"
              className="w-full"
            >
              {syncing || currentIntegration.syncStatus === 'SYNCING' || currentIntegration.syncStatus === 'in_progress'
                ? 'Syncing...'
                : 'Sync Products'}
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              variant="ghost"
              className="w-full justify-start"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {currentIntegration.syncError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Sync Error
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {currentIntegration.syncError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {currentIntegration.syncStatus === 'success' && !currentIntegration.syncError && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Connection Successful
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your Shopify store is connected and ready for syncing.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
