// Shopify Integration Page - Server Component
import { ShopifyAuthButton } from './components/ShopifyAuthButton';
import { ShopifyStatus } from './components/ShopifyStatus';
import { DisconnectButton } from './components/DisconnectButton';

export default async function ShopifyIntegrationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { success?: string; error?: string };
}) {
  const { slug } = await params;

  // Fetch current integration status
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'
  const response = await fetch(
    `${apiBase}/api/platforms/shopify?project=${slug}`,
    { cache: 'no-store' }
  );

  const { integration, isConnected } = await response.json();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Shopify Integration</h1>
      <p className="text-gray-600 mb-8">
        Connect your Shopify store to sync products and manage pricing.
      </p>

      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">✓ Successfully connected to Shopify!</p>
        </div>
      )}

      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            Failed to connect: {getErrorMessage(searchParams.error)}
          </p>
        </div>
      )}

      {isConnected ? (
        <div className="space-y-6">
          <ShopifyStatus integration={integration} projectSlug={slug} />

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <DisconnectButton projectSlug={slug} />
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Connect Your Store</h2>
          <p className="text-gray-600 mb-6">
            Authorize Calibr to access your Shopify store. You'll be redirected to Shopify to grant permissions.
          </p>
          <ShopifyAuthButton projectSlug={slug} />
        </div>
      )}
    </div>
  );
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    missing_parameters: 'OAuth callback missing required parameters',
    configuration_error: 'Shopify app not properly configured',
    invalid_signature: 'Invalid request signature',
    token_exchange_failed: 'Failed to exchange authorization code',
    no_access_token: 'No access token received from Shopify',
    save_failed: 'Failed to save integration',
    unexpected_error: 'An unexpected error occurred',
  };
  return messages[error] || error;
}
