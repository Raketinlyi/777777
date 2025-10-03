'use client';

import { ArrowLeft, Skull } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useGraveyardTokens } from '@/hooks/useGraveyardTokens';
import { useMobile } from '@/hooks/use-mobile';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
import { BurningGraveyardCard } from '@/components/burning-graveyard-card';
import { motion, AnimatePresence } from 'framer-motion';
import { TabNavigation } from '@/components/tab-navigation';
import { GlueCube } from '@/components/GlueCube';
import { useTranslation } from 'react-i18next';
import { GraveyardFog } from '@/components/graveyard-fog';
import { GhostWisps } from '@/components/ghost-wisps';

// Lightweight ash rain (CSS-only)
const AshRain = dynamic(() => import('@/components/ash-rain'), {
  ssr: false,
  loading: () => null,
});

export default function GraveyardPage() {
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const { tokens: tokenIds, loading: isLoadingNFTs } = useGraveyardTokens();
  useCrazyOctagonGame();
  const [mounted, setMounted] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showCubeAnimation, setShowCubeAnimation] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Quick cube disintegration animation when entering graveyard
    const cubeTimer = setTimeout(() => {
      setShowCubeAnimation(true);
    }, 500); // Start cube animation quicker

    // Animate title with delay
    const titleTimer = setTimeout(() => {
      setShowTitle(true);
    }, 800); // Animate title quicker

    return () => {
      clearTimeout(cubeTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  if (!mounted)
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-400 via-purple-200 to-gray-500 flex items-center justify-center text-gray-800'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Skull className='w-12 h-12 text-gray-600 animate-pulse' />
        </motion.div>
      </div>
    );

  return (
    <div className='relative min-h-screen mobile-content-wrapper bg-gradient-to-br from-gray-400 via-purple-200 to-gray-500 p-4 pb-0 overflow-hidden'>
      {/* subtle 5% pink floor tint at the bottom */}
      <div
        className='absolute inset-0 pointer-events-none z-[1]'
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(236, 72, 153, 0.05) 0%, transparent 60%)',
        }}
      />
      {/* Subtle fog and ghostly wisps */}
  <GraveyardFog intensity={0.14} speed={6} className='z-[5]' />
      <GhostWisps count={16} className='z-[6]' />
      {/* Quick cube disintegration animation on page entry */}
      {showCubeAnimation && (
        <motion.div
          className='fixed top-1/2 left-1/2 z-50 pointer-events-none'
          initial={{
            x: '-50%',
            y: '-50%',
            scale: 1,
            opacity: 1,
          }}
          animate={{
            scale: [1, 1.2, 0],
            opacity: [1, 0.8, 0],
            rotate: [0, 45, 90],
          }}
          transition={{
            duration: 1.0, // Faster animation
            ease: 'easeOut',
          }}
          onAnimationComplete={() => setShowCubeAnimation(false)}
        >
          <div className='w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-500 rounded shadow-lg relative mobile-safe-button'>
            {/* Cube fragments */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className='absolute w-2 h-2 bg-gray-500 rounded'
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200 + 50,
                  opacity: 0,
                  scale: [1, 0.5, 0],
                }}
                transition={{
                  duration: 1.0, // Quick fragment scatter
                  delay: 0.3 + i * 0.05,
                  ease: 'easeOut',
                }}
                style={{
                  left: `${(i % 3) * 33}%`,
                  top: `${Math.floor(i / 3) * 33}%`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Super-light ash rain background */}
      <AshRain density={15} className='z-20 text-gray-600' />

      {/* Removed the striped pattern overlay */}

  <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between gap-2 mobile-safe-header mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-gray-400 bg-white/80 text-gray-700 hover:bg-gray-100 hover:border-gray-500 flex-shrink-0 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 w-4 h-4' />{' '}
              {t('navigation.home', 'Home')}
            </Button>
          </Link>
          <div className='flex-1 flex justify-center min-w-0'>
            {!isMobile && <TabNavigation />}
          </div>
          <div className='flex items-center flex-shrink-0' />
        </header>

        {/* Updated title with white/gray theme */}
        <div className='text-center mb-6'>
          <motion.h1 
            className='text-3xl md:text-4xl font-bold text-gray-800 mb-2 drop-shadow-sm'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: showTitle ? 1 : 0, y: showTitle ? 0 : -20 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {t('graveyard.title', 'CUBE GRAVEYARD')}
          </motion.h1>
          <motion.p 
            className='text-gray-600 text-sm md:text-base'
            initial={{ opacity: 0 }}
            animate={{ opacity: showTitle ? 1 : 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {t('graveyard.subtitle', 'Where burned cubes smolder in eternal flames')}
          </motion.p>
        </div>

        <AnimatePresence mode='wait'>
          {isLoadingNFTs ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-center py-12'
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className='mx-auto mb-4 w-12 h-12 border-2 border-t-transparent border-gray-500 rounded-full mobile-safe-button'
              />
              <p className='text-gray-600'>
                {t(
                  'graveyard.loading',
                  'Loading your NFTs from the graveyard...'
                )}
              </p>
            </motion.div>
          ) : tokenIds.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-center py-12'
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  opacity: [1, 0.7, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Skull className='w-16 h-16 text-gray-400 mx-auto mb-6' />
              </motion.div>
              <h2 className='text-3xl md:text-4xl font-extrabold text-gray-700'>
                {t('graveyard.empty.title', 'GRAVEYARD IS EMPTY')}
              </h2>
              <p className='text-gray-500 mt-2'>
                {t('graveyard.empty.description', 'No burned cubes found.')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }} // Shorter delay to start showing cards sooner
            >
              <div className='nft-card-grid gap-4'>
                {tokenIds.slice(0, 20).map((id, idx) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.3, // Quick card appearance
                      delay: idx * 0.03, // Faster stagger between cards
                      ease: 'easeOut',
                    }}
                  >
                    <BurningGraveyardCard tokenId={id} index={idx} />
                  </motion.div>
                ))}
              </div>
              {tokenIds.length > 20 && (
                <div className='mt-8 text-center text-gray-600'>
                  <p>
                    {t(
                      'graveyard.showingFirst',
                      'Showing first 20 cubes. Total: {count}'
                    ).replace('{count}', tokenIds.length.toString())}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glue cube */}
      <GlueCube delay={5} className='fixed bottom-2 left-0 z-50' /> {/* Shorter delay for glue cube */}
    </div>
  );
}