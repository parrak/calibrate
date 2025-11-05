import { notFound } from 'next/navigation'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'

const DEMO_PROJECT = { id: 'demo', name: 'Demo Project', slug: 'demo' }

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  if (params.slug !== 'demo') notFound()

  // derive current path segment for active state (client-less)
  // Next.js layouts don't get full pathname; use labels that match child routes
  const nav = [
    { href: `/p/${params.slug}`, label: 'Dashboard', key: 'dashboard' },
    { href: `/p/${params.slug}/price-changes`, label: 'Price Changes', key: 'price-changes' },
    { href: `/p/${params.slug}/catalog`, label: 'Catalog', key: 'catalog' },
    { href: `/p/${params.slug}/competitors`, label: 'Competitors', key: 'competitors' },
    { href: `/p/${params.slug}/assistant`, label: 'AI Assistant', key: 'assistant' },
    { href: `/p/${params.slug}/integrations`, label: 'Integrations', key: 'integrations' },
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
