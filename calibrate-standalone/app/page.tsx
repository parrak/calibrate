import { CodeTabs } from '@/components/CodeTabs'
import { Logos } from '@/components/Logos'
import { Section } from '@/components/Section'
import { CTA } from '@/components/CTA'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Real-time pricing precision
            </h1>
            <p className="mt-4 text-lg text-mute max-w-xl">
              Calibr is the intelligent pricing engine with guardrails, human review, and instant rollback.
              Create a project, connect your catalog, and ship safe, explained price changes.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://console.calibr.lat/login" className="px-4 py-2 rounded-md bg-brand text-black font-medium">
                Sign in — create a Project
              </a>
              <a href="https://docs.calibr.lat" className="px-4 py-2 rounded-md border border-border text-fg hover:bg-surface">
                Read the Docs
              </a>
            </div>
            <p className="mt-3 text-sm text-mute">
              New here? Sign in to create your first Project. You'll land in your Project dashboard.
            </p>
          </div>
          <div className="bg-surface/60 border border-border rounded-xl p-4">
            <CodeTabs />
          </div>
        </div>
        <div className="absolute -z-10 inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-brand/10 blur-3xl" />
        </div>
      </section>

      {/* Logo strip */}
      <Section id="logos" className="py-10">
        <Logos />
      </Section>

      {/* Features */}
      <Section id="features" title="Built for commerce teams & developers">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            title="Guardrails by design"
            desc="Floors, ceilings, max % delta, daily budgets, time windows, and channel constraints."
          />
          <Feature
            title="Human review when you want it"
            desc="Queue, approve, apply, rollback. Full audit trail for every change."
          />
          <Feature
            title="Connect your stack"
            desc="APIs & connectors for Shopify, Amazon (soon), and internal catalogs."
          />
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" title="How it works">
        <ol className="grid md:grid-cols-3 gap-4 list-decimal list-inside">
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
      </Section>

      {/* CTA */}
      <Section id="cta">
        <CTA />
      </Section>
    </>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-base font-medium">{title}</div>
      <p className="text-sm text-mute mt-1">{desc}</p>
    </div>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs text-mute">Step {n}</div>
      <div className="text-base font-medium mt-1">{title}</div>
      <p className="text-sm text-mute mt-1">{children}</p>
    </li>
  )
}
