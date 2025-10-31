type Check = { name: string; ok: boolean; [k: string]: unknown }
export function PolicyList({ checks }:{ checks: Check[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-sm font-medium mb-2">Policy checks</div>
      <ul className="space-y-1">
        {checks?.map((c, i)=>(
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-mute">{c.name}</span>
            <span className={c.ok ? 'text-emerald-300' : 'text-red-300'}>{c.ok ? 'PASS' : 'FAIL'}</span>
          </li>
        )) || <li className="text-sm text-mute">No checks.</li>}
      </ul>
    </div>
  )
}
