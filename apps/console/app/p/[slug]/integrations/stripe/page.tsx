import { StripeIntegrationContent } from './components/StripeIntegrationContent'

export default async function StripeIntegrationPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ success?: string; error?: string }>;
}) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;

    // Fetch current integration status
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.calibr.lat'
    const response = await fetch(
        `${apiBase}/api/platforms/stripe?project=${slug}`,
        { cache: 'no-store' }
    );

    const { integration, isConnected } = await response.json();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <StripeIntegrationContent
                projectSlug={slug}
                initialIntegration={integration}
                isConnected={isConnected}
            />
        </div>
    );
}
