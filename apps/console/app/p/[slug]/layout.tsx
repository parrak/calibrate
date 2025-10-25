import { notFound } from 'next/navigation'
import Link from 'next/link'

const DEMO_PROJECT = { id: 'demo', name: 'Demo Project', slug: 'demo' }

function NavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  if (params.slug !== 'demo') notFound()

  // derive current path segment for active state (client-less)
  // Next.js layouts don’t get full pathname; use labels that match child routes
  const nav = [
    { href: `/p/${params.slug}`, label: 'Dashboard', key: 'dashboard' },
    { href: `/p/${params.slug}/price-changes`, label: 'Price Changes', key: 'price-changes' },
    { href: `/p/${params.slug}/catalog`, label: 'Catalog', key: 'catalog' },
    { href: `/p/${params.slug}/competitors`, label: 'Competitors', key: 'competitors' },
  ]

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
        <div className="sticky top-4 space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Project</div>
            <div className="mt-1 text-sm font-medium text-gray-900" aria-label="Current project">
              {DEMO_PROJECT.name}
            </div>
          </div>
          <nav aria-label="Primary" role="navigation" className="bg-white border rounded-lg p-2">
            {nav.map((item) => (
              <NavLink
                key={item.key}
                href={item.href}
                label={item.label}
                isActive={false}
              />
            ))}
          </nav>
        </div>
      </aside>
      <section className="col-span-12 lg:col-span-9 xl:col-span-10">
        {children}
      </section>
    </div>
  )
}
