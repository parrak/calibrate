/**
 * Shopify Auth Button Component
 * Handles OAuth installation flow
 */

'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui/button';
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
    if (!shopDomain.includes('.') || !shopDomain.endsWith('.myshopify.com')) {
      setError('Invalid format. Enter: mystore.myshopify.com');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call install endpoint to get OAuth URL
      const response = await fetch(
        `/api/platforms/shopify/oauth/install?project=${projectSlug}&shop=${shopDomain}`
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
      <Button onClick={() => setShowInput(true)} size="lg">
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
          size="lg"
        >
          {loading ? 'Connecting...' : 'Continue to Shopify'}
        </Button>
        <Button
          variant="outline"
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
