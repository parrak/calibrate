/**
 * Shopify Installation Page
 * Handles the OAuth installation flow
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Badge } from '@calibr/ui';

interface ShopifyInstallPageProps {
  params: {
    slug: string;
  };
}

export default function ShopifyInstallPage({ params }: ShopifyInstallPageProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      setMessage('Shopify integration installed successfully!');
    } else if (error) {
      setStatus('error');
      setMessage('Installation failed. Please try again.');
    } else {
      setStatus('loading');
      setMessage('Processing installation...');
    }
  }, [searchParams]);

  const handleRetry = () => {
    window.location.href = `/p/${params.slug}/integrations/shopify`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <div className="text-center">
            {/* Status Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
              {status === 'loading' && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              )}
              {status === 'success' && (
                <div className="rounded-full h-12 w-12 bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {status === 'error' && (
                <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Status Message */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'loading' && 'Installing Shopify Integration'}
              {status === 'success' && 'Installation Complete'}
              {status === 'error' && 'Installation Failed'}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            {/* Status Badge */}
            <div className="mb-6">
              {status === 'loading' && <Badge>Installing</Badge>}
              {status === 'success' && <Badge variant="primary">Success</Badge>}
              {status === 'error' && <Badge variant="danger">Error</Badge>}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {status === 'success' && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.href = `/p/${params.slug}/integrations/shopify`}
                    className="w-full"
                  >
                    Go to Integration Dashboard
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You can now sync products and manage pricing from your Shopify store.
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleRetry}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => window.location.href = `/p/${params.slug}/integrations`}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Integrations
                  </Button>
                </div>
              )}

              {status === 'loading' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please wait while we complete the installation...
                  </p>
                  <Button 
                    onClick={() => window.location.href = `/p/${params.slug}/integrations/shopify`}
                    variant="ghost"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you're experiencing issues with the installation, please check that:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <li>• You have admin access to your Shopify store</li>
                <li>• Your store is not in development mode</li>
                <li>• You're using a supported Shopify plan</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
