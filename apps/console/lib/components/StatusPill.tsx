export function StatusPill({ status }: { status: string }) {
  const map: Record<string,string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    APPROVED: 'bg-blue-100 text-blue-800 border border-blue-200',
    APPLIED: 'bg-green-100 text-green-800 border border-green-200',
    REJECTED: 'bg-gray-100 text-gray-800 border border-gray-200',
    FAILED: 'bg-red-100 text-red-800 border border-red-200',
    ROLLED_BACK: 'bg-orange-100 text-orange-800 border border-orange-200'
  }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-800 border border-gray-200'}`}>{status}</span>
}
