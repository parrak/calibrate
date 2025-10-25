'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; key: string }

export function ProjectSidebar({
  projectName,
  nav,
}: {
  projectName: string
  nav: NavItem[]
}) {
  const pathname = usePathname()

  return (
    <div className="sticky top-4 space-y-4">
      <div className="bg-white border rounded-lg p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">Project</div>
        <div className="mt-1 text-sm font-medium text-gray-900" aria-label="Current project">
          {projectName}
        </div>
      </div>
      <nav aria-label="Primary" role="navigation" className="bg-white border rounded-lg p-2">
        {nav.map((item) => {
          const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

