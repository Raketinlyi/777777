'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MotionStyle } from 'framer-motion';
import { Twitter, X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import React from 'react';
import { useTranslation } from 'react-i18next';

// Update the SocialSidebar component by adding links to Telegram and Discord
export const SocialSidebar = React.memo(function SocialSidebar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const [bottomOffset, setBottomOffset] = useState<string>('80px');
  const lastScrollYRef = React.useRef<number>(0);
  const autoHideTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);

  // Track page scrolling - MOBILE WITH AUTO-HIDE
  useEffect(() => {
    let showTimer: NodeJS.Timeout;

    const showIcons = () => {
      if (isManuallyClosed) return; // Don't show if manually closed
      
      setIsVisible(true);
      // Reset auto-hide timer for mobile (15s)
      if (isMobile) {
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = setTimeout(() => setIsVisible(false), 15000);
      }
    };

    if (isMobile) {
      // Mobile: show after 2 seconds
      showTimer = setTimeout(() => {
        showIcons();
      }, 2000);
      
      // Listen scroll to toggle visibility (show on scroll up, hide on scroll down)
      lastScrollYRef.current = window.scrollY;
      const onScroll = () => {
        const current = window.scrollY;
        const delta = current - lastScrollYRef.current;
        lastScrollYRef.current = current;
        if (Math.abs(delta) < 8) return;
        if (delta < 0) {
          showIcons();
        } else {
          setIsVisible(false);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      
      // Swipe-down to hide
      const onTouchStart = (e: TouchEvent) => {
        touchStartYRef.current = e.touches[0]?.clientY ?? null;
      };
      const onTouchMove = (e: TouchEvent) => {
        const startY = touchStartYRef.current;
        const firstTouch = e.touches && e.touches.length > 0 ? e.touches[0] : undefined;
        if (startY === null || !firstTouch) return;
        const dy = (firstTouch.clientY ?? 0) - startY;
        if (dy > 24) {
          setIsVisible(false);
          touchStartYRef.current = null;
        }
      };
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      
      // Safe bottom offset (avoid bottom nav) + iOS safe area
      try {
        setBottomOffset('calc(76px + env(safe-area-inset-bottom))');
      } catch {
        setBottomOffset('76px');
      }
      
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('touchstart', onTouchStart as any);
        window.removeEventListener('touchmove', onTouchMove as any);
      };
    } else {
      // Desktop: show immediately and stay visible
      setIsVisible(true);
    }

    // Clean up timers when component unmounts
    return () => {
      if (showTimer) {
        clearTimeout(showTimer);
      }
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [isMobile, isManuallyClosed]);

  // Reset manual close flag after 1 hour
  useEffect(() => {
    if (isManuallyClosed && isMobile) {
      const resetTimer = setTimeout(() => {
        setIsManuallyClosed(false);
      }, 60 * 60 * 1000); // 1 hour

      return () => clearTimeout(resetTimer);
    }
    return;
  }, [isManuallyClosed, isMobile]);

  // Define styles based on device
  const sidebarClass = isMobile
    ? 'fixed left-0 right-0 z-50 flex-row justify-center pointer-events-none'
    : 'fixed top-1/2 -translate-y-1/2 left-0 z-50 flex-col';

  const motionStyle: MotionStyle = isMobile ? { bottom: bottomOffset } : {};

  return (
    <motion.div
      initial={isMobile ? { y: 120, opacity: 0 } : { x: -100 }}
      animate={
        isVisible
          ? isMobile
            ? { y: 0, opacity: 1 }
            : { x: 0 }
          : isMobile
            ? { y: 120, opacity: 0 }
            : { x: -100 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`${sidebarClass}`}
      style={motionStyle}
    >
      <div
        className={
          isMobile
            ? 'flex items-center gap-2 mx-auto max-w-[220px] px-2 py-2 rounded-full relative pointer-events-auto bg-gradient-to-r from-slate-900/90 to-blue-900/90 backdrop-blur-md border border-cyan-500/20 shadow-lg shadow-cyan-500/10'
            : 'flex flex-col items-center gap-2 p-2 rounded-xl pointer-events-auto bg-gradient-to-b from-slate-900/90 to-blue-900/90 backdrop-blur-md border border-cyan-500/20 shadow-lg shadow-cyan-500/10'
        }
      >
      {/* Close button for mobile */}
      {isMobile && isVisible && (
        <button
          onClick={() => {
            setIsVisible(false);
            setIsManuallyClosed(true);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center border border-red-300 shadow-lg"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Twitter/X */}
      <a
        href='https://x.com/crazy___cube'
        target='_blank'
        rel='noopener noreferrer'
        className='relative group'
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-full border border-cyan-500/30 shadow-md shadow-cyan-500/10 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'} flex items-center justify-center`}>
          <Twitter className={`text-cyan-300 ${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
        </motion.div>
        {!isMobile && (
          <span className='absolute left-full ml-2 top-1/2 -translate-y-1/2 text-cyan-300 text-xs font-medium bg-slate-900/90 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap'>
            Twitter/X
          </span>
        )}
      </a>

      {/* Telegram */}
      <a
        href='https://t.me/+gEnPkDekDKgzZmYx'
        target='_blank'
        rel='noopener noreferrer'
        className='relative group'
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-full border border-blue-500/30 shadow-md shadow-blue-500/10 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'} flex items-center justify-center`}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width={isMobile ? '20' : '20'}
            height={isMobile ? '20' : '20'}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-blue-400'
          >
            <path d='M21.5 4.5L2.5 12.5L11.5 14.5L14.5 21.5L21.5 4.5Z' />
            <path d='M11.5 14.5L14.5 21.5' />
            <path d='M11.5 14.5L16.5 9.5' />
          </svg>
        </motion.div>
        <span className='absolute left-full ml-2 top-1/2 -translate-y-1/2 text-blue-300 text-sm font-medium bg-slate-900/90 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:block'>
          {t('social.telegram')}
        </span>
      </a>

      {/* Discord */}
      <a
        href='https://discord.gg/a8tufdh65m'
        target='_blank'
        rel='noopener noreferrer'
        className='relative group'
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-full border border-indigo-500/30 shadow-md shadow-indigo-500/10 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'} flex items-center justify-center`}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width={isMobile ? '20' : '20'}
            height={isMobile ? '20' : '20'}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-indigo-400'
          >
            <path d='M9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12Z' />
            <path d='M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z' />
            <path d='M9 6C9 6 10 4 12 4C14 4 15 6 15 6' />
            <path d='M19.5 7L18.5 5H5.5L4.5 7' />
            <path d='M4.5 7C4.5 7 3 15 3 16C3 17 3.5 20 8 20C12.5 20 11.5 17 11.5 17' />
            <path d='M19.5 7C19.5 7 21 15 21 16C21 17 20.5 20 16 20C11.5 20 12.5 17 12.5 17' />
          </svg>
        </motion.div>
        <span className='absolute left-full ml-2 top-1/2 -translate-y-1/2 text-indigo-300 text-sm font-medium bg-slate-900/90 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:block'>
          {t('social.discord')}
        </span>
      </a>

      </div>

    </motion.div>
  );
});
