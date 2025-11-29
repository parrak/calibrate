import Image from 'next/image'

const logos = [
  { name: 'Shopify', src: '/brands/shopify.svg', width: 120, height: 40 },
  { name: 'Stripe', src: '/brands/stripe.svg', width: 120, height: 40 },
  { name: 'Amazon', src: '/brands/amazon.svg', width: 140, height: 40 },
] as const

export function Logos() {
  return (
    <div className="mx-auto max-w-6xl border border-border rounded-xl bg-surface/40 px-6 py-4">
      <div className="text-xs text-mute mb-3">Plays nicely with</div>
      <div className="grid grid-cols-3 gap-8 opacity-80">
        {logos.map((logo) => (
          <Logo key={logo.name}>
            <Image
              alt={`${logo.name} logo`}
              src={logo.src}
              width={logo.width}
              height={logo.height}
              className="h-8 w-auto object-contain"
            />
          </Logo>
        ))}
      </div>
    </div>
  )
}

function Logo({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-12 rounded-md border border-border bg-surface flex items-center justify-center px-4">
      {children}
    </div>
  )
}
