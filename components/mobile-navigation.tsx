'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Heart, Zap, Info, Skull, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const getNavItems = (t: TFunction) => [
  { href: '/', label: t('navigation.home', 'Home'), icon: Home },
  { href: '/ping', label: t('tabs.ping', 'Ping'), icon: Zap },
  { href: '/burn', label: t('tabs.burn', 'Burn'), icon: Flame },
  { href: '/breed', label: t('tabs.breed', 'Breed'), icon: Heart },
  { href: '/graveyard', label: t('tabs.graveyard', 'Graveyard'), icon: Skull },
  { href: '/claim', label: t('tabs.claim', 'Claim'), icon: Coins },
  { href: '/info', label: t('tabs.info', 'Info'), icon: Info },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { isMobile } = useMobile();
  const { t } = useTranslation();

  // Show only on mobile devices (not on desktop)
  if (!isMobile) return null;

  return (
    <div className='fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm border-t border-slate-800'>
      <nav className='mobile-nav'>
        <div className='flex justify-around items-center h-16 px-2'>
          {getNavItems(t).map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 px-1',
                  'text-muted-foreground hover:text-foreground',
                  isActive && 'text-primary'
                )}
              >
                <Icon className='w-4 h-4 mb-1 flex-shrink-0' />
                <span className='text-xs truncate max-w-full'>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
