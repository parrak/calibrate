"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Page error</h2>
      <pre className="text-xs bg-gray-100 p-2 rounded">{error?.message || 'Unknown error'}</pre>
      <button onClick={() => reset()} className="mt-3 bg-gray-800 text-white px-3 py-1 rounded">
        Retry
      </button>
    </div>
  )
}

