export function SimpleTable({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-border">{head}</thead>
        <tbody className="bg-surface divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}
