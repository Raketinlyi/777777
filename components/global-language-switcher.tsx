'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMobile } from '@/hooks/use-mobile';

// Dynamically import the I18nLanguageSwitcher with no SSR
const I18nLanguageSwitcher = dynamic(
  () =>
    import('./i18n-language-switcher').then(mod => mod.I18nLanguageSwitcher),
  { ssr: false }
);

export function GlobalLanguageSwitcher() {
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const { isMobile } = useMobile();

  // Restore hidden flag on mount (mobile only)
  useEffect(() => {
    if (!isMobile) { 
      setReady(true); 
      return; 
    }
    
    const hiddenUntil = localStorage.getItem('crazycube:langSwitcher:hiddenUntil');
    if (hiddenUntil) {
      const hiddenUntilTime = parseInt(hiddenUntil, 10);
      if (Date.now() < hiddenUntilTime) {
        setHidden(true);
        setReady(true);
        // Automatically show after timeout
        const timeout = setTimeout(() => {
          setHidden(false);
          localStorage.removeItem('crazycube:langSwitcher:hiddenUntil');
        }, hiddenUntilTime - Date.now());
        return () => clearTimeout(timeout);
      } else {
        // Timeout expired, show
        localStorage.removeItem('crazycube:langSwitcher:hiddenUntil');
        setHidden(false);
        setReady(true);
        return;
      }
    } else {
      setHidden(false);
    setReady(true);
      return;
    }
  }, [isMobile]);

  if (!ready || hidden) return null;
  return (
    <div className={`fixed z-40 ${isMobile ? 'top-2 left-2' : 'top-4 left-6'}`}>
      <I18nLanguageSwitcher />
    {isMobile && (
        <button
          aria-label="Hide translator"
          className="absolute -top-2 -right-2 bg-black/70 border border-slate-800 rounded-full p-1"
          onClick={() => {
            // Hide for 1 hour
            const hideUntil = Date.now() + 60 * 60 * 1000;
            localStorage.setItem('crazycube:langSwitcher:hiddenUntil', String(hideUntil));
            setHidden(true);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
