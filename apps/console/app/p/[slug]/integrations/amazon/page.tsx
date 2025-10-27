import Link from 'next/link'

export default function AmazonIntegrationIndex({ params }: { params: { slug: string } }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Amazon Integration</h1>
        <p className="text-sm text-gray-600">Tools for Amazon pricing and competitive data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/p/${params.slug}/integrations/amazon/pricing`}
          className="block bg-white border rounded-lg p-5 hover:shadow"
        >
          <div className="font-medium">Pricing Feed</div>
          <div className="text-sm text-gray-600">Submit price feeds and poll feed status</div>
        </Link>
        <Link
          href={`/p/${params.slug}/integrations/amazon/competitive`}
          className="block bg-white border rounded-lg p-5 hover:shadow"
        >
          <div className="font-medium">Competitive Pricing</div>
          <div className="text-sm text-gray-600">Track Buy Box and offer prices for ASINs</div>
        </Link>
      </div>
    </div>
  )
}

