'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; key: string; icon?: string }

const iconMap: Record<string, string> = {
  dashboard: '📊',
  'price-changes': '💰',
  catalog: '📦',
  rules: '⚙️',
  competitors: '🎯',
  assistant: '🤖',
  analytics: '📈',
  integrations: '🔌',
}

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
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-xs uppercase tracking-wide text-mute">Project</div>
        <div className="mt-1 text-sm font-semibold text-fg" aria-label="Current project">
          {projectName}
        </div>
      </div>
      <nav aria-label="Primary" role="navigation" className="bg-surface border border-border rounded-xl p-2">
        {nav.map((item) => {
          const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
          const icon = iconMap[item.key] || '•'
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? 'bg-brand/10 text-brand font-semibold shadow-sm'
                  : 'text-fg hover:bg-bg hover:text-brand'
              }`}
            >
              <span className="text-base" aria-hidden="true">{icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

