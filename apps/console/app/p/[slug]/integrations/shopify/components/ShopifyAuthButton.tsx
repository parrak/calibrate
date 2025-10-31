/**
 * Shopify Auth Button Component
 * Handles OAuth installation flow
 */

'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui';
import { AlertCircle } from 'lucide-react';

interface ShopifyAuthButtonProps {
  projectSlug: string;
  onSuccess?: () => void;
}

export function ShopifyAuthButton({ projectSlug, onSuccess }: ShopifyAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleConnect = async () => {
    if (!shopDomain) {
      setError('Please enter your shop domain');
      return;
    }

    // Validate shop domain format
    // Allow both "mystore.myshopify.com" and "mystore" formats
    const normalizedShop = shopDomain.trim().toLowerCase();
    if (normalizedShop.includes('.')) {
      // If it includes a dot, it must end with .myshopify.com
      if (!normalizedShop.endsWith('.myshopify.com')) {
        setError('Invalid format. Enter: mystore.myshopify.com or mystore');
        return;
      }
    }
    // If no dot, it's a simple store name - install route will normalize it

    setLoading(true);
    setError(null);

    try {
      // Call install endpoint to get OAuth URL
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat';
      const response = await fetch(
        `${apiUrl}/api/platforms/shopify/oauth/install?project=${projectSlug}&shop=${encodeURIComponent(shopDomain)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start OAuth flow');
      }

      const { installUrl } = await response.json();
      // Redirect to Shopify OAuth consent screen
      window.location.href = installUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setLoading(false);
    }
  };

  if (!showInput) {
    return (
      <Button onClick={() => setShowInput(true)}>
        Connect Shopify Store
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="shop-domain" className="block text-sm font-medium mb-2">
          Shopify Store Domain
        </label>
        <input
          id="shop-domain"
          type="text"
          placeholder="mystore.myshopify.com"
          value={shopDomain}
          onChange={(e) => setShopDomain(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConnect();
            }
          }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your full Shopify store domain (e.g., mystore.myshopify.com)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleConnect}
          disabled={loading || !shopDomain}
        >
          {loading ? 'Connecting...' : 'Continue to Shopify'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setShowInput(false);
            setShopDomain('');
            setError(null);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
