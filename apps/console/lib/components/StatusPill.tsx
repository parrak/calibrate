export function StatusPill({ status }: { status: string }) {
  const map: Record<string,string> = {
    PENDING: 'bg-zinc-800 text-zinc-200',
    APPROVED: 'bg-emerald-900/40 text-emerald-200',
    APPLIED: 'bg-emerald-800 text-emerald-100',
    REJECTED: 'bg-zinc-800 text-zinc-300',
    FAILED: 'bg-red-900/50 text-red-200',
    ROLLED_BACK: 'bg-amber-900/40 text-amber-200'
  }
  return <span className={`px-2 py-0.5 rounded ${map[status] ?? 'bg-zinc-700 text-white'}`}>{status}</span>
}
