/**
 * Shopify Status Component
 * Displays integration status and connection information
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@calibr/ui';

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

export function ShopifyStatus({ integration, projectSlug, onUpdate }: ShopifyStatusProps) {
  const [testing, setTesting] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<ShopifyIntegration>(integration);

  // Sync prop changes to local state
  useEffect(() => {
    setCurrentIntegration(integration);
  }, [integration]);

  const handleTestConnection = async () => {
    // Use NEXT_PUBLIC_API_URL or fallback to NEXT_PUBLIC_API_BASE or localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
                   process.env.NEXT_PUBLIC_API_BASE ||
                   'http://localhost:3000';

    try {
      setTesting(true);
      
      if (!projectSlug) {
        throw new Error('Project slug is required for connection test');
      }
      
      // Call the sync endpoint with projectSlug
      // Include credentials for CORS if needed
      const response = await fetch(`${apiUrl}/api/integrations/shopify/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials for CORS
        body: JSON.stringify({
          projectSlug,
          action: 'test_connection',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Connection test failed');
      }

      const data = await response.json();
      
      // Update local state
      const updated = {
        ...currentIntegration,
        syncStatus: data.result?.connected ? 'success' : 'error',
        syncError: data.result?.connected ? null : (data.result?.status?.message || 'Connection failed'),
        lastSyncAt: new Date().toISOString(),
      };
      setCurrentIntegration(updated);
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updated);
      }

    } catch (error) {
      console.error('Connection test error:', error);
      console.error('API URL used:', apiUrl);
      console.error('Project slug:', projectSlug);
      
      let errorMessage = 'Connection test failed';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Network error: Cannot connect to API at ${apiUrl}. Make sure the API server is running.`;
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
        return <Badge variant="primary">Syncing</Badge>;
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Integration Status
        </h2>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Connection Details
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Store:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {currentIntegration.shopDomain}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Installed:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(currentIntegration.installedAt)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(currentIntegration.lastSyncAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Actions
          </h3>
          <div className="space-y-2">
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
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Sync Error
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {currentIntegration.syncError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {currentIntegration.syncStatus === 'success' && !currentIntegration.syncError && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                Connection Successful
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your Shopify store is connected and ready for syncing.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
