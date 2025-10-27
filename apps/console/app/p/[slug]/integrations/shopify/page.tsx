/**
 * Shopify Integration Page
 * Main page for managing Shopify integration
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@calibr/ui';
import { ShopifyAuthButton } from './components/ShopifyAuthButton';
import { ShopifyStatus } from './components/ShopifyStatus';
import { ShopifySyncControls } from './components/ShopifySyncControls';

interface ShopifyIntegration {
  id: string;
  shopDomain: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  installedAt: string;
}

interface ShopifyIntegrationPageProps {
  params: {
    slug: string;
  };
}

export default function ShopifyIntegrationPage({ params }: ShopifyIntegrationPageProps) {
  const [integration, setIntegration] = useState<ShopifyIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegration();
  }, [params.slug]);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/shopify/status?project_id=${params.slug}`);
      
      if (response.ok) {
        const data = await response.json();
        setIntegration(data.integration);
      } else if (response.status === 404) {
        setIntegration(null);
      } else {
        throw new Error('Failed to fetch integration status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationUpdate = (updatedIntegration: ShopifyIntegration) => {
    setIntegration(updatedIntegration);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Error Loading Integration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchIntegration}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Shopify Integration
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect your Shopify store to automate pricing updates
          </p>
        </div>

        {/* Integration Status */}
        {integration ? (
          <div className="space-y-6">
            <ShopifyStatus 
              integration={integration}
              onUpdate={handleIntegrationUpdate}
            />
            
            <ShopifySyncControls 
              integration={integration}
              onUpdate={handleIntegrationUpdate}
            />
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Connect Your Shopify Store
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Install the Calibrate app in your Shopify store to start syncing products and automating pricing.
              </p>
              <ShopifyAuthButton 
                projectId={params.slug}
                onSuccess={handleIntegrationUpdate}
              />
            </div>
          </Card>
        )}

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Product Sync
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically sync products and variants from your Shopify store to Calibrate.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Price Updates
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Push approved price changes back to your Shopify store automatically.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Real-time Updates
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Receive webhooks for inventory changes and product updates in real-time.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
