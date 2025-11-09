import { notFound } from 'next/navigation'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { GuidedTour } from '@/components/GuidedTour'

const DEMO_PROJECT = { id: 'demo', name: 'Demo Project', slug: 'demo' }

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (slug !== 'demo') notFound()

  // derive current path segment for active state (client-less)
  // Next.js layouts don't get full pathname; use labels that match child routes
  const nav = [
    { href: `/p/${slug}`, label: 'Dashboard', key: 'dashboard' },
    { href: `/p/${slug}/catalog`, label: 'Catalog', key: 'catalog' },
    { href: `/p/${slug}/price-changes`, label: 'Price Changes', key: 'price-changes' },
    { href: `/p/${slug}/rules`, label: 'Pricing Rules', key: 'rules' },
    { href: `/p/${slug}/assistant`, label: 'AI Suggestions', key: 'assistant' },
    { href: `/p/${slug}/analytics`, label: 'Analytics', key: 'analytics' },
    { href: `/p/${slug}/competitors`, label: 'Competitors', key: 'competitors' },
    { href: `/p/${slug}/integrations`, label: 'Settings', key: 'integrations' },
  ]

  return (
    <>
      <GuidedTour projectSlug={slug} />
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
          <ProjectSidebar projectName={DEMO_PROJECT.name} nav={nav} />
        </aside>
        <section className="col-span-12 lg:col-span-9 xl:col-span-10">
          <Breadcrumbs />
          {children}
        </section>
      </div>
    </>
  )
}
