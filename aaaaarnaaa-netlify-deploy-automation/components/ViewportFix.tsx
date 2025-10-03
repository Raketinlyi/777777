'use client';
import { useEffect } from 'react';

/**
 * Replaces inline <script dangerouslySetInnerHTML> in layout.tsx.
 * Safely, without nonce, under CSP 'script-src self'.
 */
export default function ViewportFix() {
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);
  return null;
}
