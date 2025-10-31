export function JSONView({ value }:{ value:unknown }) {
  return (
    <pre className="rounded-xl border border-border bg-surface p-3 text-xs overflow-auto">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  )
}
