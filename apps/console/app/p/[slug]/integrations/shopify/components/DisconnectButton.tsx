'use client';

import { useState } from 'react';
import { Button } from '@calibr/ui';

interface DisconnectButtonProps {
  projectSlug: string;
  onDisconnect?: () => void;
}

export function DisconnectButton({ projectSlug, onDisconnect }: DisconnectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) {
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat';
      const response = await fetch(`${apiUrl}/api/platforms/shopify?project=${projectSlug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect');
      }

      // Reload page or call callback
      if (onDisconnect) {
        onDisconnect();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to disconnect Shopify:', error);
      alert(error instanceof Error ? error.message : 'Failed to disconnect');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="danger"
      onClick={handleDisconnect}
      disabled={loading}
    >
      {loading ? 'Disconnecting...' : 'Disconnect Shopify'}
    </Button>
  );
}

