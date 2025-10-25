'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button, EmptyState } from '@/lib/components'

type Project = {
  id: string
  name: string
  slug: string
  createdAt: string
}

const API_FALLBACK = 'http://localhost:3001'

export default function Projects() {
  const router = useRouter()
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const apiToken = (session as any)?.apiToken as string | undefined

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      return
    }

    let isMounted = true

    async function loadProjects() {
      setLoading(true)
      setError('')
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || API_FALLBACK
        const headers: Record<string, string> = {}
        if (apiToken) {
          headers.Authorization = `Bearer ${apiToken}`
        }
        const res = await fetch(`${apiBase}/api/projects?userId=${userId}`, { headers })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Unable to load projects.')
        }
        const data = await res.json()
        if (isMounted) {
          setProjects(Array.isArray(data.projects) ? data.projects : [])
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load projects.')
          setProjects([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id, apiToken])


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
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <EmptyState
          title="No projects yet"
          desc="Create your first project to get started with price management."
        >
          <Button aria-label="Create a new project" onClick={() => router.push('/onboarding/project')}>
            Create Project
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button aria-label="Create a new project" onClick={() => router.push('/onboarding/project')}>
          Create Project
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          {error}
        </div>
      )}

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

