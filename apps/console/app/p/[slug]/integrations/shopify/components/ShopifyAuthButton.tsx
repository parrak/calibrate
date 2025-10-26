"use client";

import { useState } from 'react';
import { Button } from '@calibr/ui';

interface ShopifyAuthButtonProps {
  projectId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export default function ShopifyAuthButton({
  projectId,
  onSuccess,
  onError,
  variant = 'primary',
  size = 'md',
  children = 'Connect Shopify Store',
}: ShopifyAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);

    try {
      // Get shop domain from user
      const shopDomain = prompt('Enter your Shopify store domain (e.g., my-store):');
      
      if (!shopDomain) {
        setLoading(false);
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
        onError?.('Invalid Shopify store domain format');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/platforms/shopify/oauth/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          shopDomain: normalizedDomain,
          redirectUri: `${window.location.origin}/api/platforms/shopify/oauth/callback`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Shopify OAuth
        window.location.href = data.authUrl;
      } else {
        onError?.(data.message || 'Failed to initiate Shopify installation');
      }
    } catch (error) {
      console.error('Shopify connection error:', error);
      onError?.('Failed to connect to Shopify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleConnect}
      disabled={loading}
    >
      {loading ? 'Connecting...' : children}
    </Button>
  );
}
