export function SimpleTable({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">{head}</thead>
        <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  )
}
