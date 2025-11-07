export default function EarlyAccess() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get Early Access</h1>
          <p className="text-xl text-mute max-w-2xl mx-auto">
            Tell us about your store and pricing challenges. We'll onboard you personally
            and help you ship your first price changes with confidence.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-8 shadow-xl">
          {/* Replace with your Typeform/Tally embed */}
          <iframe
            className="w-full h-[720px] rounded-lg border-0"
            src="https://tally.so/r/your-form-id"
            title="Early Access Form"
          />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-mute">
            We review applications within 24 hours.{' '}
            <a href="/" className="text-brand hover:underline">Back to home</a>
          </p>
        </div>
      </section>
    </main>
  )
}

