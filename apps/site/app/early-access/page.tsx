import { EarlyAccessForm } from './EarlyAccessForm'

export default function EarlyAccess() {
  return (
    <main className="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]">
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--brand)]/10 text-[color:var(--brand)] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[color:var(--brand)] animate-pulse"></span>
            Limited Openings Available
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Get Early Access</h1>
          <p className="text-xl text-[color:var(--mute)] max-w-2xl mx-auto leading-relaxed">
            Tell us about your store and pricing challenges. We'll onboard you personally
            and help you ship your first price changes with confidence.
          </p>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[color:var(--brand)] to-transparent opacity-50"></div>
          <EarlyAccessForm />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[color:var(--mute)]">
            We review applications within 24 hours.{' '}
            <a href="/" className="text-[color:var(--brand)] font-medium hover:underline">Back to home</a>
          </p>
        </div>
      </section>
    </main>
  )
}

