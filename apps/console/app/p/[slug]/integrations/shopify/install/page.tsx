"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card } from '@calibr/ui';

export default function ShopifyInstallPage() {
  const params = useParams() as { slug: string };
  const [shopDomain, setShopDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain.trim()) {
      setError('Please enter your Shopify store domain');
      return;
    }

    // Normalize shop domain
    let normalizedDomain = shopDomain.trim().toLowerCase();
    if (!normalizedDomain.endsWith('.myshopify.com')) {
      normalizedDomain = `${normalizedDomain}.myshopify.com`;
    }

    // Validate domain format
    const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopifyDomainRegex.test(normalizedDomain)) {
      setError('Invalid Shopify store domain format');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/platforms/shopify/oauth/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.slug,
          shopDomain: normalizedDomain,
          redirectUri: `${window.location.origin}/api/platforms/shopify/oauth/callback`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Shopify OAuth
        window.location.href = data.authUrl;
      } else {
        setError(data.message || 'Failed to initiate Shopify installation');
      }
    } catch (error) {
      console.error('Installation error:', error);
      setError('Failed to connect to Shopify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Shopify Store</h1>
        <p className="text-gray-600">
          Connect your Shopify store to start syncing products and managing pricing
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleInstall} className="space-y-6">
          <div>
            <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-700 mb-2">
              Shopify Store Domain
            </label>
            <div className="flex">
              <input
                type="text"
                id="shopDomain"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="your-store"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                .myshopify.com
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enter your store name (e.g., "my-store" for my-store.myshopify.com)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Connecting...' : 'Connect Shopify Store'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => window.location.href = `/p/${params.slug}/integrations/shopify`}
              className="w-full"
            >
              Back to Integration
            </Button>
          </div>
        </form>
      </Card>

      {/* Information Section */}
      <Card className="p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">What happens next?</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
              1
            </div>
            <p>You'll be redirected to Shopify to authorize the Calibrate app</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
              2
            </div>
            <p>Review and approve the requested permissions</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <p>You'll be redirected back to Calibrate with your store connected</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
              4
            </div>
            <p>Start syncing products and managing your pricing strategy</p>
          </div>
        </div>
      </Card>

      {/* Permissions Section */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Required Permissions</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Read products and variants</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Update product prices</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Read inventory levels</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Receive webhook notifications</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Calibrate only requests the minimum permissions needed to manage your pricing strategy.
        </p>
      </Card>
    </div>
  );
}
