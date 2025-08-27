'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Flame,
  Heart,
  Coins,
  Bell,
  Skull,
  Info,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';

/**
 * Under-the-hood navigation hang fix:
 *  - remove manual flag isNavigating/targetPath/setTimeout
 *  - use React.useTransition()
 *  - preserve visual 1:1
 */
export const TabNavigation = React.memo(function TabNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const [isPending, startTransition] = React.useTransition();

  const tr = (key: string, fallback: string) => t(key, fallback);

  const tabs = useMemo(
    () => [
      { path: '/ping', label: tr('tabs.ping', 'Ping'), icon: <Bell className="w-4 h-4 mr-1" /> },
      { path: '/breed', label: tr('tabs.breed', 'Breeding'), icon: <Heart className="w-4 h-4 mr-1" /> },
      { path: '/burn', label: tr('tabs.burn', 'Burn'), icon: <Flame className="w-4 h-4 mr-1" /> },
      { path: '/graveyard', label: tr('tabs.graveyard', 'Graveyard'), icon: <Skull className="w-4 h-4 mr-1" /> },
      { path: '/rewards', label: tr('tabs.rewards', 'Rewards'), icon: <Coins className="w-4 h-4 mr-1" /> },
      { path: '/bridge', label: tr('tabs.bridge', 'Bridge'), icon: <ArrowRightLeft className="w-4 h-4 mr-1" /> },
      { path: '/info', label: tr('tabs.info', 'Info'), icon: <Info className="w-4 h-4 mr-1" /> },
    ],
    [t]
  );

  useEffect(() => {
    // safe prefetch
    // @ts-ignore
    if (typeof router.prefetch === 'function') {
      tabs.forEach((tab) => {
        try {
          // @ts-ignore
          router.prefetch(tab.path);
        } catch {}
      });
    }
  }, [router, tabs]);

  const go = (path: string) => {
    if (pathname === path) return;
    startTransition(() => {
      router.push(path);
    });
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="crypto-card bg-card/50 backdrop-blur-md rounded-2xl p-2 shadow-xl max-w-full overflow-hidden">
        <div className="flex space-x-1 md:space-x-2 flex-wrap justify-center">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            const showSpinner = isPending && !isActive;

            return (
              <motion.div
                key={tab.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`relative transition-all duration-200 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 ${
                    isActive
                      ? `neon-button neon-outline`
                      : `text-foreground/70 hover:text-foreground hover:bg-card/50`
                  } ${showSpinner ? 'opacity-70' : ''}`}
                  onClick={() => go(tab.path)}
                  disabled={showSpinner}
                >
                  {showSpinner ? (
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 animate-spin" />
                  ) : (
                    tab.icon
                  )}
                  <span className="relative z-10">{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/20 to-primary/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
