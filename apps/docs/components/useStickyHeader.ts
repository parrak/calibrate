'use client';

import { useEffect } from 'react';

/**
 * Hook to add shadow to sticky header on scroll
 * Adds 'is-stuck' class when page scrolled > 8px
 */
export default function useStickyHeader() {
  useEffect(() => {
    const nav = document.querySelector('.topnav');
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 8) {
        nav.classList.add('is-stuck');
      } else {
        nav.classList.remove('is-stuck');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Check initial state

    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
