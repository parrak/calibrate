import Link from 'next/link'
import { getServerSession, authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@calibr/db'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect('/login')
  }

  // Check if user has any projects
  const db = prisma()
  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { Project: true },
    take: 1,
  })

  // If no projects, redirect to onboarding
  if (memberships.length === 0) {
    redirect('/onboarding')
  }

  // If user has projects, show project selection
  const allMemberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { Project: true },
    orderBy: { Project: { createdAt: 'desc' } },
  })

  return (
    <div className="space-y-6 p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allMemberships.map((membership) => (
            <Link
              key={membership.Project.id}
              href={`/p/${membership.Project.slug}`}
              className="block bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors"
            >
              <div className="font-semibold">{membership.Project.name}</div>
              <div className="text-sm opacity-90">/{membership.Project.slug}</div>
            </Link>
          ))}
          <Link
            href="/onboarding"
            className="flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded hover:border-blue-500 hover:text-blue-600 transition-colors text-center min-h-[72px]"
          >
            <div>
              <div className="text-2xl mb-1">+</div>
              <div className="text-sm font-medium">Create New Project</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">System Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/performance"
            className="block bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition-colors text-center"
          >
            <div className="font-semibold">Performance Dashboard</div>
            <div className="text-sm opacity-90">Monitor system performance</div>
          </Link>
          <Link
            href="/security"
            className="block bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 transition-colors text-center"
          >
            <div className="font-semibold">Security Dashboard</div>
            <div className="text-sm opacity-90">Security audit and monitoring</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
