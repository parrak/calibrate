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
    <div className="sticky top-20 space-y-4">
      <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
        <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--mute)' }}>Project</div>
        <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-strong)' }} aria-label="Current project">
          {projectName}
        </div>
      </div>
      <nav aria-label="Primary" role="navigation" className="bg-surface border border-border rounded-xl p-2 shadow-sm">
        {nav.map((item) => {
          const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
          const icon = iconMap[item.key] || '•'
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="text-sm"
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

