export function StatusPill({ status }: { status: string }) {
  // WCAG AA compliant color combinations (4.5:1 contrast ratio minimum)
  // Using darker, more saturated colors for better contrast
  const map: Record<string,string> = {
    PENDING: 'bg-yellow-500 text-yellow-950 border border-yellow-600',
    APPROVED: 'bg-blue-600 text-blue-50 border border-blue-700',
    APPLIED: 'bg-green-600 text-green-50 border border-green-700',
    REJECTED: 'bg-gray-600 text-gray-50 border border-gray-700',
    FAILED: 'bg-red-600 text-red-50 border border-red-700',
    ROLLED_BACK: 'bg-orange-600 text-orange-50 border border-orange-700',
    PREVIEW: 'bg-gray-500 text-gray-50 border border-gray-600',
    QUEUED: 'bg-yellow-500 text-yellow-950 border border-yellow-600',
    APPLYING: 'bg-blue-600 text-blue-50 border border-blue-700',
  }
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-600 text-gray-50 border border-gray-700'}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  )
}
