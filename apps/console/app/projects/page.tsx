'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, EmptyState } from '@/lib/components'

type Project = {
  id: string
  name: string
  slug: string
  createdAt: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with API fetch for user projects
    setProjects([
      { id: 'demo', name: 'Demo Project', slug: 'demo', createdAt: new Date().toISOString() },
    ])
    setLoading(false)
  }, [])

  if (loading)
    return (
      <div className="p-6 space-y-3">
        <div className="h-6 w-36 bg-gray-200 animate-pulse rounded" />
        <div className="h-24 w-full bg-gray-100 animate-pulse rounded" />
      </div>
    )

  if (!projects.length) {
    return (
      <div className="p-6">
        <EmptyState
          title="No projects yet"
          desc="Create your first project to get started with price management."
        >
          <Button aria-label="Create a new project">Create Project</Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button aria-label="Create a new project">Create Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/p/${project.slug}`}
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">{project.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Slug: {project.slug}</p>
            <div className="text-xs text-gray-500">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}

