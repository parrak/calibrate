export function CTA() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 md:p-8 flex flex-col md:flex-row gap-4 md:items-center justify-between">
      <div>
        <div className="text-lg font-medium">Ready to calibrate your pricing?</div>
        <p className="text-sm text-mute">Sign in to create a Project and connect your catalog.</p>
      </div>
      <div className="flex gap-3">
        <a href="https://console.calibr.lat/login" className="px-4 py-2 rounded-md bg-brand text-black font-medium">
          Sign in
        </a>
        <a href="https://docs.calibr.lat" className="px-4 py-2 rounded-md border border-border">Read docs</a>
      </div>
    </div>
  )
}
