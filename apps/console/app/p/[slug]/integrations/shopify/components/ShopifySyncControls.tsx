/**
 * Shopify Sync Controls Component
 * Handles manual sync operations and price updates
 */

'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@calibr/ui';

interface ShopifyIntegration {
  id: string;
  shopDomain: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  installedAt: string;
}

interface ShopifySyncControlsProps {
  integration: ShopifyIntegration;
  onUpdate: (integration: ShopifyIntegration) => void;
}

export function ShopifySyncControls({ integration, onUpdate }: ShopifySyncControlsProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncAction, setSyncAction] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async (action: string) => {
    try {
      setSyncing(true);
      setSyncAction(action);
      setSyncResult(null);

      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: integration.id.split('_')[0], // Extract project ID
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync operation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSyncResult(data.result);

      // Update integration status
      onUpdate({
        ...integration,
        lastSyncAt: data.timestamp,
        syncStatus: 'success',
        syncError: null,
      });

    } catch (error) {
      setSyncResult({
        error: error instanceof Error ? error.message : 'Sync operation failed',
      });

      onUpdate({
        ...integration,
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Sync operation failed',
      });
    } finally {
      setSyncing(false);
      setSyncAction(null);
    }
  };

  const handlePriceUpdate = async () => {
    // This would typically open a modal or form for price updates
    // For now, we'll just show a placeholder
    alert('Price update feature coming soon! This will allow you to push approved price changes to Shopify.');
  };

  const isDisabled = syncing || integration.syncStatus === 'in_progress';

  return (
    <div className="space-y-6">
      {/* Sync Operations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Sync Operations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Product Sync
            </h3>
            <Button 
              onClick={() => handleSync('sync_products')}
              disabled={isDisabled}
              className="w-full"
            >
              {syncing && syncAction === 'sync_products' ? 'Syncing Products...' : 'Sync Products'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Import products and variants from Shopify
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Webhook Setup
            </h3>
            <Button 
              onClick={() => handleSync('setup_webhooks')}
              disabled={isDisabled}
              variant="ghost"
              className="w-full"
            >
              {syncing && syncAction === 'setup_webhooks' ? 'Setting up...' : 'Setup Webhooks'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure real-time webhook notifications
            </p>
          </div>
        </div>
      </Card>

      {/* Price Updates */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Price Management
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Push Price Updates
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send approved price changes to your Shopify store
              </p>
            </div>
            <Button 
              onClick={handlePriceUpdate}
              disabled={isDisabled}
              variant="primary"
            >
              Update Prices
            </Button>
          </div>
        </div>
      </Card>

      {/* Sync Results */}
      {syncResult && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Sync Results
          </h2>
          
          {syncResult.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Sync Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {syncResult.error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {syncResult.productsCount && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Products Synced
                  </span>
                  <Badge variant="primary">{syncResult.productsCount}</Badge>
                </div>
              )}
              
              {syncResult.webhooksCount && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Webhooks Configured
                  </span>
                  <Badge variant="primary">{syncResult.webhooksCount}</Badge>
                </div>
              )}
              
              {syncResult.successCount && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Price Updates Successful
                  </span>
                  <Badge variant="primary">{syncResult.successCount}</Badge>
                </div>
              )}
              
              {syncResult.errorCount && syncResult.errorCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Price Updates Failed
                  </span>
                  <Badge variant="danger">{syncResult.errorCount}</Badge>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
