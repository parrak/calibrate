"use client";

import { useState } from 'react';
import { Button, Card } from '@calibr/ui';

interface ShopifySyncControlsProps {
  projectId: string;
  onSyncStart?: () => void;
  onSyncComplete?: (result: any) => void;
  onSyncError?: (error: string) => void;
}

export default function ShopifySyncControls({
  projectId,
  onSyncStart,
  onSyncComplete,
  onSyncError,
}: ShopifySyncControlsProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const handleSync = async (syncType: string) => {
    setSyncing(true);
    onSyncStart?.();

    try {
      const response = await fetch('/api/platforms/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          syncType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLastSyncResult(data);
        onSyncComplete?.(data);
      } else {
        const error = data.message || 'Sync failed';
        onSyncError?.(error);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = 'Failed to sync. Please try again.';
      onSyncError?.(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleProductSync = async () => {
    await handleSync('products');
  };

  const handleIncrementalSync = async () => {
    await handleSync('incremental');
  };

  const handleFullSync = async () => {
    await handleSync('full');
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">Sync Controls</h3>
      
      <div className="space-y-3">
        {/* Sync Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="primary"
            onClick={handleProductSync}
            disabled={syncing}
            className="w-full"
          >
            {syncing ? 'Syncing...' : 'Sync Products Only'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleIncrementalSync}
            disabled={syncing}
            className="w-full"
          >
            {syncing ? 'Syncing...' : 'Sync Recent Changes'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleFullSync}
            disabled={syncing}
            className="w-full"
          >
            {syncing ? 'Syncing...' : 'Full Sync'}
          </Button>
        </div>

        {/* Sync Status */}
        {syncing && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-sm text-blue-800">Synchronizing with Shopify...</p>
            </div>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && !syncing && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              <strong>Last Sync:</strong> {lastSyncResult.message}
            </p>
            {lastSyncResult.summary && (
              <p className="text-xs text-green-700 mt-1">
                {lastSyncResult.summary.successful}/{lastSyncResult.summary.total} items processed successfully
              </p>
            )}
          </div>
        )}

        {/* Sync Information */}
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Products Only:</strong> Syncs product data without inventory</p>
          <p><strong>Recent Changes:</strong> Syncs items updated in the last 24 hours</p>
          <p><strong>Full Sync:</strong> Syncs all products and variants</p>
        </div>
      </div>
    </Card>
  );
}
