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
    // For now, we'll use a hardcoded demo project
    // In a real app, this would fetch from an API
    setProjects([
      {
        id: 'demo',
        name: 'Demo Project',
        slug: 'demo',
        createdAt: new Date().toISOString()
      }
    ])
    setLoading(false)
  }, [])

  if (loading) return <div className="p-6">Loading…</div>

  if (!projects.length) {
    return (
      <div className="p-6">
        <EmptyState 
          title="No projects yet" 
          desc="Create your first project to get started with price management."
        >
          <Button>Create Project</Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button>Create Project</Button>
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
            <div className="text-xs text-gray-400">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
