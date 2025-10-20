export function Logos() {
  return (
    <div className="mx-auto max-w-6xl border border-border rounded-xl bg-surface/40 px-6 py-4">
      <div className="text-xs text-mute mb-3">Plays nicely with</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-80">
        <Logo>Shopify</Logo>
        <Logo>Stripe</Logo>
        <Logo>HubSpot</Logo>
        <Logo>Snowflake</Logo>
      </div>
    </div>
  )
}

function Logo({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-10 rounded-md border border-border bg-surface flex items-center justify-center text-mute text-sm">
      {children}
    </div>
  )
}
