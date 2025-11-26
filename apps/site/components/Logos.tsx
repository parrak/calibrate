import Image from 'next/image'

export function Logos() {
  return (
    <div className="mx-auto max-w-6xl border border-border rounded-xl bg-surface/40 px-6 py-4">
      <div className="text-xs text-mute mb-3">Plays nicely with</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 opacity-80">
        <Logo src="/logos/shopify.svg" alt="Shopify" />
        <Logo src="/logos/stripe.svg" alt="Stripe" />
        <Logo src="/logos/amazon.svg" alt="Amazon" />
      </div>
    </div>
  )
}

function Logo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-12 rounded-md border border-border bg-white flex items-center justify-center p-3">
      <Image
        src={src}
        alt={alt}
        width={120}
        height={40}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
