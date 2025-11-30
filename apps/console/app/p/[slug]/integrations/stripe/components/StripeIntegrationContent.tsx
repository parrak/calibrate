'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/Card'
import { Button } from '@/lib/components/Button'
import { StripeConnectModal } from '@/components/platforms/StripeConnectModal'
import { TransactionsTable } from './TransactionsTable'
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface StripeIntegrationContentProps {
    projectSlug: string
    initialIntegration: unknown
    isConnected: boolean
}

export function StripeIntegrationContent({
    projectSlug,
    isConnected: initialIsConnected,
}: StripeIntegrationContentProps) {
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [showConnectModal, setShowConnectModal] = useState(false)

    const handleConnectSuccess = () => {
        setIsConnected(true)
        // Ideally fetch fresh integration data here
        window.location.reload() // Simple reload to refresh server data
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Stripe Integration</h1>
                    <p className="text-gray-600 mt-2">
                        Sync products, prices, and transactions from your Stripe account.
                    </p>
                </div>
                <div className="flex gap-2">
                    {isConnected ? (
                        <Button variant="outline" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Stripe Dashboard
                        </Button>
                    ) : (
                        <Button onClick={() => setShowConnectModal(true)}>
                            Connect Stripe
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <>
                                <div className="bg-green-100 p-2 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-green-900">Connected</div>
                                    <div className="text-sm text-green-700">
                                        Your Stripe account is connected and syncing.
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-gray-500" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Not Connected</div>
                                    <div className="text-sm text-gray-600">
                                        Connect your Stripe account to start syncing data.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {isConnected && (
                <>
                    <TransactionsTable projectSlug={projectSlug} />
                </>
            )}

            <StripeConnectModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                onSuccess={handleConnectSuccess}
                projectSlug={projectSlug}
            />
        </div>
    )
}
