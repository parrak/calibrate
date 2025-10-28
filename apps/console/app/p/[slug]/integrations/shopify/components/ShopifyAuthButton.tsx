/**
 * Shopify Auth Button Component
 * Handles OAuth installation flow
 */

'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui';

interface ShopifyAuthButtonProps {
  projectId: string;
  onSuccess: (integration: any) => void;
}

export function ShopifyAuthButton({ projectId, onSuccess }: ShopifyAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get shop domain from user
      const shopDomain = prompt('Enter your Shopify store domain (e.g., mystore.myshopify.com):');
      
      if (!shopDomain) {
        return;
      }

      // Validate shop domain format
      if (!shopDomain.endsWith('.myshopify.com')) {
        setError('Please enter a valid Shopify store domain (e.g., mystore.myshopify.com)');
        return;
      }

      // Start OAuth flow
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat';
      const response = await fetch(`${apiBase}/api/integrations/shopify/oauth/install`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add shop domain as query parameter
        // Note: This is a simplified approach. In production, you'd want a proper form
      });

      if (!response.ok) {
        throw new Error('Failed to start OAuth flow');
      }

      const data = await response.json();
      
      // Redirect to Shopify OAuth
      window.location.href = data.authUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start installation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleInstall}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Starting Installation...' : 'Install Shopify App'}
      </Button>
      
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        You'll be redirected to Shopify to authorize the app installation
      </div>
    </div>
  );
}
