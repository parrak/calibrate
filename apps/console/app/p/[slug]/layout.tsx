import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'

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
    { href: `/p/${params.slug}/integrations/amazon/pricing`, label: 'Amazon Pricing (Beta)', key: 'amazon-pricing' },
  ]

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
        <ProjectSidebar projectName={DEMO_PROJECT.name} nav={nav} />
      </aside>
      <section className="col-span-12 lg:col-span-9 xl:col-span-10">
        <Breadcrumbs />
        {children}
      </section>
    </div>
  )
}
