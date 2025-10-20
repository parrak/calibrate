export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Calibrate
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Smart Pricing Platform
        </p>
        <div className="space-y-4">
          <p className="text-gray-500">
            Landing page coming soon...
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="http://localhost:3001" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Console
            </a>
            <a 
              href="http://localhost:3003" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
