'use client'

import { useState, useEffect } from 'react'
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

interface SidebarNavProps {
  projectName: string
  nav: NavItem[]
  /** Live count of PENDING price changes — shown in the sidebar badge. */
  pendingPriceChanges?: number
}

export function SidebarNav({ projectName, nav, pendingPriceChanges }: SidebarNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [startX, setStartX] = useState<number | null>(null)

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Split navigation items roughly matching the design system
  const workspaceNav = nav.filter(n => !['assistant', 'analytics', 'integrations'].includes(n.key))
  const intelligenceNav = nav.filter(n => ['assistant', 'analytics', 'integrations'].includes(n.key))

  const NavContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Mobile-only header inside drawer */}
      <div className="flex items-center justify-between px-1 pb-2 mb-2 min-[900px]:hidden">
        <div className="flex items-center gap-2 font-semibold text-[14px] text-[color:var(--text-strong)]">
          <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-[color:var(--brand-light)] to-[color:var(--brand-dark)]" />
          Calibrate
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-[36px] h-[36px] rounded-[9px] border border-border bg-surface flex items-center justify-center cursor-pointer hover:bg-bg-subtle"
          aria-label="Close menu"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="#001845" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2.5 p-2.5 min-[900px]:p-3 rounded-[10px] bg-[color:var(--brand-subtle)]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[color:var(--brand-light)] to-[color:var(--brand-dark)] flex items-center justify-center text-[#001845] font-bold text-[13px] shadow-[0_1px_2px_rgba(0,128,128,0.25)] shrink-0">
          A
        </div>
        <div className="flex flex-col min-w-0 leading-[1.15]">
          <span className="text-[10px] uppercase tracking-[0.08em] text-mute font-semibold">Project</span>
          <span className="text-[13px] font-semibold text-[color:var(--text-strong)] truncate">
            {projectName}
          </span>
        </div>
        <span className="ml-auto text-mute text-[12px]" aria-hidden="true">⌄</span>
      </div>

      <div className="h-px bg-border mx-1 my-2.5" />
      <div className="px-1 pb-1 text-[10px] uppercase tracking-[0.08em] text-mute font-semibold">Workspace</div>

      <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
        {workspaceNav.map(renderItem)}
      </ul>

      {intelligenceNav.length > 0 && (
        <>
          <div className="h-px bg-border mx-1 my-2.5" />
          <div className="px-1 pb-1 text-[10px] uppercase tracking-[0.08em] text-mute font-semibold">Intelligence</div>
          <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
            {intelligenceNav.map(renderItem)}
          </ul>
        </>
      )}

      {/* Grabber indicator for mobile */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-[44px] rounded bg-border opacity-70 min-[900px]:hidden pointer-events-none" aria-hidden="true" />
    </div>
  )

  function renderItem(item: NavItem) {
    const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
    const icon = iconMap[item.key] || '•'

    return (
      <li key={item.key}>
        <Link
          href={item.href}
          onClick={() => {
            // Give a little time for ripple effect, then close
            setTimeout(() => setIsOpen(false), 180)
          }}
          aria-current={isActive ? 'page' : undefined}
          className={`group flex items-center gap-2.5 px-2.5 py-2 min-[900px]:py-2 max-[900px]:p-[12px_10px] rounded-[10px] text-[13.5px] max-[900px]:text-[15px] max-[900px]:min-h-[44px] font-medium transition-colors duration-150 relative outline-none focus-visible:ring-2 focus-visible:ring-brand/35 select-none touch-manipulation ${
            isActive
              ? 'bg-gradient-to-b from-[rgba(0,163,163,0.11)] to-[rgba(0,163,163,0.06)] text-[color:var(--text-strong)]'
              : 'text-mute hover:bg-bg-subtle hover:text-[color:var(--text-strong)]'
          }`}
        >
          {isActive && (
            <div className="absolute -left-[10px] top-2 bottom-2 w-[3px] rounded-[3px] bg-brand shadow-[0_0_0_2px_rgba(0,163,163,0.12)]" />
          )}
          <em className={`not-italic flex justify-center text-[16px] max-[900px]:text-[18px] w-[20px] max-[900px]:w-[24px] shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}>
            {icon}
          </em>
          {item.label}
          {item.key === 'price-changes' && pendingPriceChanges !== undefined && pendingPriceChanges > 0 && (
            <span className={`ml-auto font-mono text-[11px] px-[7px] py-[1px] rounded-full leading-[1.4] border ${
              isActive
                ? 'bg-white text-brand border-brand/25'
                : 'text-mute bg-bg-subtle border-border'
            }`}>
              {pendingPriceChanges}
            </span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <>
      {/* Mobile Topbar (Hidden on desktop) */}
      <div className="min-[900px]:hidden flex items-center h-[52px] bg-surface border-b border-border px-2.5 mx-[-16px] mt-[-24px] mb-6 sm:mx-[-24px]">
        <button
          className="w-10 h-10 rounded-[10px] border border-border bg-surface flex items-center justify-center cursor-pointer hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 mr-2.5"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls="drawer"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <path d="M1 1h16M1 7h16M1 13h16" stroke="#001845" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 text-[13px] text-[color:var(--text-strong)] font-semibold min-w-0">
          <span className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-[color:var(--brand-light)] to-[color:var(--brand-dark)] flex items-center justify-center text-[#001845] font-bold text-[11px] shrink-0">
            A
          </span>
          <span className="truncate">{projectName}</span>
          <span className="text-mute font-normal">/</span>
          {/* Rough derivation of current view from nav items for mobile crumb context */}
          <span className="truncate">
            {nav.find(n => pathname === n.href || (pathname?.startsWith(n.href + '/') ?? false))?.label || ''}
          </span>
        </div>
      </div>

      {/* Scrim (Mobile only) */}
      <div
        className={`fixed inset-0 z-40 bg-[rgba(0,24,69,0.35)] backdrop-blur-[2px] transition-opacity duration-220 min-[900px]:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer / Rail */}
      <aside
        id="drawer"
        className={`fixed min-[900px]:sticky top-0 min-[900px]:top-20 z-50 min-[900px]:z-0 bg-surface border-r min-[900px]:border border-border min-[900px]:rounded-[14px] p-2.5 shadow-[2px_0_24px_rgba(0,24,69,0.12)] min-[900px]:shadow-[0_1px_3px_rgba(0,24,69,0.04)]
          w-[min(86%,300px)] min-[900px]:w-[264px] h-full min-[900px]:h-fit
          pt-[calc(10px+env(safe-area-inset-top))] min-[900px]:pt-2.5
          pb-[calc(10px+env(safe-area-inset-bottom))] min-[900px]:pb-2.5
          pl-[calc(10px+env(safe-area-inset-left))] min-[900px]:pl-2.5
          transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          min-[900px]:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-[102%]'} text-[color:var(--text)]
        `}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-label="Primary Navigation"
        onTouchStart={(e) => setStartX(e.touches[0].clientX)}
        onTouchMove={(e) => {
          if (startX !== null) {
            const dx = e.touches[0].clientX - startX
            // Swipe left to close
            if (dx < -40) {
              setIsOpen(false)
              setStartX(null)
            }
          }
        }}
        onTouchEnd={() => setStartX(null)}
      >
        <NavContent />
      </aside>
    </>
  )
}
