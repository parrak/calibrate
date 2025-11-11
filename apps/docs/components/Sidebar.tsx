'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navigation = [
  {
    title: 'Getting Started',
    href: '/console/getting-started',
  },
  {
    title: 'Core Features',
    items: [
      { title: 'Product Catalog', href: '/console/catalog' },
      { title: 'Price Changes', href: '/console/price-changes' },
      { title: 'Pricing Rules', href: '/console/pricing-rules' },
      { title: 'Platform Integrations', href: '/console/integrations' },
    ],
  },
  {
    title: 'Intelligence & Insights',
    items: [
      { title: 'AI Assistant', href: '/console/ai-assistant' },
      { title: 'Analytics', href: '/console/analytics' },
      { title: 'Competitor Monitoring', href: '/console/competitors' },
    ],
  },
  {
    title: 'Reference & Help',
    items: [
      { title: 'Roles & Permissions', href: '/console/roles-permissions' },
      { title: 'Best Practices', href: '/console/best-practices' },
      { title: 'Troubleshooting', href: '/console/troubleshooting' },
      { title: 'API Reference', href: '/console/api-reference' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/console') {
      return pathname === '/console'
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-lg shadow-sm"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          className="icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          sidebar fixed top-0 left-0 h-full w-64 z-40
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full overflow-y-auto pt-16 lg:pt-4 pb-8 px-4">
          <div className="mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-[color:var(--fg)] hover:text-[color:var(--brand)] transition-colors"
            >
              <svg
                className="icon-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold text-lg">
                <span style={{ color: 'var(--brand)' }}>Calibrate</span>{' '}
                <span>Docs</span>
              </span>
            </Link>
          </div>

          <nav className="space-y-1">
            <Link
              href="/console"
              className={isActive('/console') && pathname === '/console' ? 'active' : ''}
            >
              Overview
            </Link>

            {navigation.map((section) => (
              <div key={section.title} className="mt-6">
                {section.href ? (
                  <Link
                    href={section.href}
                    className={isActive(section.href) ? 'active' : ''}
                  >
                    {section.title}
                  </Link>
                ) : (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--mute)' }}>
                      {section.title}
                    </div>
                    {section.items?.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={isActive(item.href) ? 'active' : ''}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

