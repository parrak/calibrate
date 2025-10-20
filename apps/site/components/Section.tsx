export function Section({
  id, title, children, className = ''
}: { id?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-6 py-16 ${className}`}>
      {title && <h2 className="text-2xl font-semibold tracking-tight mb-6">{title}</h2>}
      {children}
    </section>
  )
}
