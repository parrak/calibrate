import Link from 'next/link'

export default function Home() {
  // For now, show a simple project selection
  // In a real app, this would check user authentication and show their projects
  return (
    <div className="space-y-6 p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/p/demo"
            className="block bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors text-center"
          >
            <div className="font-semibold">Demo Project</div>
            <div className="text-sm opacity-90">Manage price changes</div>
          </Link>
          <Link
            href="/performance"
            className="block bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition-colors text-center"
          >
            <div className="font-semibold">Performance Dashboard</div>
            <div className="text-sm opacity-90">Monitor system performance</div>
          </Link>
          <Link
            href="/security"
            className="block bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 transition-colors text-center"
          >
            <div className="font-semibold">Security Dashboard</div>
            <div className="text-sm opacity-90">Security audit and monitoring</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
