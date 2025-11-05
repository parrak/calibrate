import { Logos } from '@/components/Logos'
import { Section } from '@/components/Section'
import { CTA } from '@/components/CTA'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
              Now in Production
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Dynamic pricing with guardrails
            </h1>
            <p className="mt-6 text-xl text-mute max-w-xl leading-relaxed">
              Stop editing spreadsheets. Calibrate automates safe price changes with AI guardrails,
              human oversight, and instant rollback. From strategy to execution in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="https://console.calibr.lat/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand/90 transition-all shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5"
              >
                Try the Console
                <span className="ml-2">→</span>
              </a>
              <a
                href="/early-access"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-border text-fg font-semibold hover:bg-surface hover:border-fg/20 transition-all"
              >
                Join Early Access
              </a>
            </div>
            <p className="mt-3 text-sm text-mute">
              Questions? <a href="mailto:contact@calibr.lat" className="underline hover:text-fg">Contact us</a>
            </p>
            <p className="mt-6 text-sm text-mute flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required • Set up in minutes
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-purple-500/20 rounded-2xl blur-3xl"></div>
            <div className="relative bg-surface/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-2xl">
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/demo-poster.png"
                className="w-full h-auto"
                aria-label="Calibrate console demo showing price changes and guardrails"
              >
                <source src="/demo.mp4" type="video/mp4" />
                <img src="/demo.gif" alt="Calibrate demo showing price management workflow" />
              </video>
            </div>
          </div>
        </div>
        <div className="absolute -z-10 inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="absolute -top-40 -right-40 w-[580px] h-[580px] rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-purple-500/10 blur-3xl" />
        </div>
      </section>

      {/* Logo strip */}
      <Section id="logos" className="py-10">
        <Logos />
      </Section>

      {/* Features */}
      <Section id="features" title="Built for commerce teams & developers">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            icon="🛡️"
            title="Guardrails by design"
            desc="Floors, ceilings, max % delta, daily budgets, time windows, and channel constraints."
          />
          <Feature
            icon="👥"
            title="Human review when you want it"
            desc="Queue, approve, apply, rollback. Full audit trail for every change."
          />
          <Feature
            icon="🔌"
            title="Connect your stack"
            desc="APIs & connectors for Shopify, Amazon (soon), and internal catalogs."
          />
        </div>
      </Section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <blockquote className="text-sm text-mute leading-relaxed">
              <p className="mb-3">"Finally stopped editing CSVs for every sale."</p>
              <cite className="text-fg font-medium not-italic">— Shopify Merchant</cite>
            </blockquote>
            <blockquote className="text-sm text-mute leading-relaxed">
              <p className="mb-3">"Guardrails let us automate without fear."</p>
              <cite className="text-fg font-medium not-italic">— Agency Owner</cite>
            </blockquote>
            <blockquote className="text-sm text-mute leading-relaxed">
              <p className="mb-3">"Explainable AI made approvals a breeze."</p>
              <cite className="text-fg font-medium not-italic">— DTC Brand</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* How it works */}
      <Section id="how" title="How it works">
        <div className="relative">
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent"></div>
          <ol className="grid md:grid-cols-3 gap-6 relative">
            <Step n="1" title="Create a Project">
              Projects scope your catalog, policies, and users. Sign in and create your first Project.
            </Step>
            <Step n="2" title="Send a price suggestion">
              Post a signed webhook with your <code>X-Calibr-Project</code> header. Calibr evaluates guardrails.
            </Step>
            <Step n="3" title="Approve & apply safely">
              Apply with one click (or auto-apply). Rollback instantly with versioned prices.
            </Step>
          </ol>
        </div>
      </Section>

      {/* CTA */}
      <Section id="cta">
        <CTA />
      </Section>
    </>
  )
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-6 hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5 transition-all duration-300">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-lg font-semibold mb-2">{title}</div>
      <p className="text-sm text-mute leading-relaxed">{desc}</p>
    </div>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="relative rounded-xl border border-border bg-surface p-6 hover:border-brand/30 hover:shadow-md transition-all">
      <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-brand text-black font-bold flex items-center justify-center text-sm shadow-lg">
        {n}
      </div>
      <div className="text-lg font-semibold mt-2 mb-2">{title}</div>
      <p className="text-sm text-mute leading-relaxed">{children}</p>
    </li>
  )
}
