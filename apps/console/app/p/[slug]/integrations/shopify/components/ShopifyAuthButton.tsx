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
}

interface ShopifyAppBridgeConfig {
  apiKey: string;
  host: string;
  forceRedirect?: boolean;
}

interface ShopifyAppBridgeApp {
  dispatch(action: { type: string; payload?: unknown }): unknown;
}

type ShopifyRedirectAction = 'REMOTE';

interface ShopifyAppBridgeRedirect {
  dispatch(action: ShopifyRedirectAction, destination: string): void;
}

interface ShopifyAppBridgeActions {
  Redirect: {
    Action: {
      REMOTE: ShopifyRedirectAction;
    };
    create(app: ShopifyAppBridgeApp): ShopifyAppBridgeRedirect;
  };
}

interface ShopifyAppBridgeModule {
  default(config: ShopifyAppBridgeConfig): ShopifyAppBridgeApp;
  actions: ShopifyAppBridgeActions;
}

interface ShopifyAppBridgeWindow extends Window {
  appBridge?: ShopifyAppBridgeModule;
  ['app-bridge']?: ShopifyAppBridgeModule;
}

declare global {
  interface Window {
    appBridge?: ShopifyAppBridgeModule;
    ['app-bridge']?: ShopifyAppBridgeModule;
  }
}

function resolveAppBridge(): ShopifyAppBridgeModule | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const globalWindow = window as ShopifyAppBridgeWindow;

  if (globalWindow.appBridge) {
    return globalWindow.appBridge;
  }

  if (globalWindow['app-bridge']) {
    globalWindow.appBridge = globalWindow['app-bridge'];
    return globalWindow.appBridge;
  }

  return null;
}

async function loadAppBridge(): Promise<ShopifyAppBridgeModule | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const existingModule = resolveAppBridge();
  if (existingModule) {
    return existingModule;
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-shopify-app-bridge]');
  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load App Bridge script')), { once: true });
    });
    return resolveAppBridge();
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@shopify/app-bridge@3/dist/app-bridge.min.js';
    script.async = true;
    script.dataset.shopifyAppBridge = 'true';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => reject(new Error('Failed to load App Bridge script')));
    document.head.appendChild(script);
  });

  return resolveAppBridge();
}

async function redirectToShopifyInstall(installUrl: string, host: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

  if (host && apiKey) {
    try {
      const appBridge = await loadAppBridge();
      if (appBridge?.default && appBridge?.actions?.Redirect) {
        const app = appBridge.default({
          apiKey,
          host,
          forceRedirect: true,
        });
        const redirect = appBridge.actions.Redirect.create(app);
        redirect.dispatch(appBridge.actions.Redirect.Action.REMOTE, installUrl);
        return;
      }
    } catch (error) {
      console.error('Shopify App Bridge redirect failed, falling back to window redirect', error);
    }

    if (window.top) {
      window.top.location.href = installUrl;
      return;
    }
  }

  window.location.href = installUrl;
}

export function ShopifyAuthButton({ projectSlug }: ShopifyAuthButtonProps) {
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
      const params = new URLSearchParams({
        project: projectSlug,
        shop: shopDomain,
      });

      const hostParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('host')
        : null;

      if (hostParam) {
        params.set('host', hostParam);
      }

      const response = await fetch(
        `${apiUrl}/api/platforms/shopify/oauth/install?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start OAuth flow');
      }

      const { installUrl } = await response.json();
      await redirectToShopifyInstall(installUrl, hostParam);
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
