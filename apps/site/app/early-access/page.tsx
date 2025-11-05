export default function EarlyAccess() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold">Early Access</h1>
        <p className="mt-3 text-mute">
          Tell us about your store and pricing pain. We'll onboard you personally.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-surface p-4">
          {/* Replace with your Typeform/Tally embed */}
          <iframe
            className="w-full h-[720px] rounded-lg"
            src="https://tally.so/r/your-form-id"
            title="Early Access Form"
          />
        </div>
      </section>
    </main>
  )
}

