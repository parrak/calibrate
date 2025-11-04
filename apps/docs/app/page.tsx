export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Calibrate Documentation
        </h1>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Webhooks</h3>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                <div>POST /api/v1/webhooks/price-suggestion</div>
                <div className="text-gray-600 mt-1">Submit price change suggestions</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Price Changes</h3>
              <div className="space-y-2">
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  <div>GET /api/v1/price-changes</div>
                  <div className="text-gray-600">List price changes</div>
                </div>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  <div>POST /api/v1/price-changes/{"{id}"}/approve</div>
                  <div className="text-gray-600">Approve a price change</div>
                </div>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  <div>POST /api/v1/price-changes/{"{id}"}/apply</div>
                  <div className="text-gray-600">Apply a price change</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Catalog</h3>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                <div>GET /api/v1/catalog?productCode=PRO</div>
                <div className="text-gray-600 mt-1">Get product catalog information</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Note:</strong> Full documentation coming soon.
              For now, check the API routes in the source code.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
