'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function labelFor(segment: string) {
  if (!segment) return 'Home'
  if (segment === 'p') return 'Projects'
  if (segment === 'price-changes') return 'Price Changes'
  if (segment === 'catalog') return 'Catalog'
  if (segment === 'competitors') return 'Competitors'
  return decodeURIComponent(segment)
}

export function Breadcrumbs() {
  const pathname = usePathname() || '/'
  const parts = pathname.split('/').filter(Boolean)

  // Build cumulative hrefs
  const crumbs = parts.map((seg, idx) => {
    const href = '/' + parts.slice(0, idx + 1).join('/')
    return { href, segment: seg, isLast: idx === parts.length - 1 }
  })

  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-gray-500">
        <li>
          <Link href="/" className="hover:text-gray-900">Home</Link>
        </li>
        {crumbs.map(({ href, segment, isLast }, i) => (
          <li key={i} className="flex items-center gap-1">
            <span aria-hidden>›</span>
            {isLast ? (
              <span className="text-gray-900" aria-current="page">{labelFor(segment)}</span>
            ) : (
              <Link href={href} className="hover:text-gray-900">
                {labelFor(segment)}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

