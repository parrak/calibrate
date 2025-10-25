import Link from 'next/link'

export default function Home() {
  // For now, show a simple project selection
  // In a real app, this would check user authentication and show their projects
  return (
    <div className="space-y-6 p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Select a Project</h2>
        <div className="space-y-2">
          <Link
            href="/p/demo"
            className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Demo Project
          </Link>
        </div>
      </div>
    </div>
  )
}
