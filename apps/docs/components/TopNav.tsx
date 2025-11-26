'use client';

import Link from 'next/link';
import Image from 'next/image';
import useStickyHeader from './useStickyHeader';

export function TopNav() {
  useStickyHeader();

  return (
    <header className="topnav">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between w-full">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image src="/logo.png" alt="Calibrate" width={120} height={32} className="h-8 w-auto" priority />
            <span className="text-lg font-semibold" style={{ color: 'var(--brand)' }}>Calibrate</span>
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
