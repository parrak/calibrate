"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 16, fontFamily: 'ui-sans-serif, system-ui, -apple-system' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
            {error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => reset()}
            style={{ marginTop: 12, background: '#1f2937', color: '#fff', padding: '6px 12px', borderRadius: 6 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

