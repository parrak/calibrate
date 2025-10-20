export function DiffCard({ currency, fromAmount, toAmount }:{ currency:string; fromAmount:number; toAmount:number }) {
  const fmt = (v:number)=> `${currency} ${(v/100).toFixed(2)}`
  const delta = toAmount - fromAmount
  const pct = fromAmount ? (delta/fromAmount)*100 : 0
  const color = delta >= 0 ? 'text-emerald-300' : 'text-red-300'
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-sm text-mute mb-1">Price change</div>
      <div className="text-lg">{fmt(fromAmount)} <span className="text-mute">→</span> {fmt(toAmount)}</div>
      <div className={`text-sm ${color}`}>{delta>=0?'+':''}{pct.toFixed(1)}%</div>
    </div>
  )
}
