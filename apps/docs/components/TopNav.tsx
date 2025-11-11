'use client';

import Link from 'next/link';
import useStickyHeader from './useStickyHeader';

export function TopNav() {
  useStickyHeader();

  return (
    <header className="topnav">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between w-full">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold transition-colors"
            style={{ color: 'var(--text-strong)' }}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" style={{ color: 'var(--brand)' }} />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" style={{ color: 'var(--brand)', opacity: 0.6 }} />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" style={{ color: 'var(--brand)', opacity: 0.6 }} />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" style={{ color: 'var(--accent)' }} />
            </svg>
            <span className="text-lg" style={{ color: 'var(--brand)' }}>Calibrate</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm transition-colors"
              style={{ color: 'var(--mute)' }}
            >
              Docs
            </Link>
            <Link
              href="/console"
              className="text-sm transition-colors"
              style={{ color: 'var(--mute)' }}
            >
              Console Guide
            </Link>
            <Link
              href="/api-spec"
              target="_blank"
              className="text-sm transition-colors"
              style={{ color: 'var(--mute)' }}
            >
              API Reference
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://calibr.lat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors"
            style={{ color: 'var(--mute)' }}
          >
            calibr.lat
          </a>
        </div>
      </nav>
    </header>
  );
}
