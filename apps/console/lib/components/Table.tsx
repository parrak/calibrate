export function Table({ head, children }:{ head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface">{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
