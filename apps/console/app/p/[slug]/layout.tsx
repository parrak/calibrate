import { notFound } from 'next/navigation'
import { SidebarNav } from '@/components/SidebarNav'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { GuidedTour } from '@/components/GuidedTour'
import { prisma } from '@calibr/db'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch the project to ensure it exists
  const db = prisma()
  const project = await db.project.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true }
  })

  if (!project) notFound()

  // derive current path segment for active state (client-less)
  // Next.js layouts don't get full pathname; use labels that match child routes
  const nav = [
    { href: `/p/${slug}`, label: 'Dashboard', key: 'dashboard' },
    { href: `/p/${slug}/catalog`, label: 'Catalog', key: 'catalog' },
    { href: `/p/${slug}/price-changes`, label: 'Price Changes', key: 'price-changes' },
    { href: `/p/${slug}/rules`, label: 'Pricing Rules', key: 'rules' },
    { href: `/p/${slug}/assistant`, label: 'AI Assistant', key: 'assistant' },
    { href: `/p/${slug}/analytics`, label: 'Analytics', key: 'analytics' },
    { href: `/p/${slug}/competitors`, label: 'Competitors', key: 'competitors' },
    { href: `/p/${slug}/integrations`, label: 'Integrations', key: 'integrations' },
  ]

  return (
    <>
      <GuidedTour projectSlug={slug} />
      <div className="flex flex-col min-[900px]:flex-row min-[900px]:items-start gap-6">
        <SidebarNav projectName={project.name} nav={nav} />
        <section className="flex-1 min-w-0 w-full">
          <div className="hidden min-[900px]:block">
            <Breadcrumbs />
          </div>
          {children}
        </section>
      </div>
    </>
  )
}
