'use client';

import { ArrowLeft, Skull } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useGraveyardTokens } from '@/hooks/useGraveyardTokens';
import { useMobile } from '@/hooks/use-mobile';
import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { GraveyardCubeCard } from '@/components/GraveyardCubeCard';
import { motion, AnimatePresence } from 'framer-motion';
import { TabNavigation } from '@/components/tab-navigation';
import { GlueCube } from '@/components/GlueCube';
import { useTranslation } from 'react-i18next';

// Lightweight ash rain (CSS-only)
const AshRain = dynamic(() => import('@/components/ash-rain'), {
  ssr: false,
  loading: () => null,
});

export default function GraveyardPage() {
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const { tokens: tokenIds, loading: isLoadingNFTs } = useGraveyardTokens();
  const { graveyardSize } = useCrazyCubeGame();
  const [mounted, setMounted] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showCubeAnimation, setShowCubeAnimation] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Quick cube disintegration animation when entering graveyard
    const cubeTimer = setTimeout(() => {
      setShowCubeAnimation(true);
    }, 1000); // Start cube animation after 1 second delay

    // Animate title with delay
    const titleTimer = setTimeout(() => {
      setShowTitle(true);
    }, 1200); // Animate title after cube animation starts

    return () => {
      clearTimeout(cubeTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  if (!mounted)
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center text-white'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Skull className='w-12 h-12 text-red-400 animate-pulse' />
        </motion.div>
      </div>
    );

  return (
    <div className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-4 pb-24'>
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
            duration: 1.2, // 20% faster than before
            ease: 'easeOut',
          }}
          onAnimationComplete={() => setShowCubeAnimation(false)}
        >
          <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 border border-red-400 rounded shadow-lg relative mobile-safe-button'>
            {/* Cube fragments */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className='absolute w-2 h-2 bg-red-500 rounded'
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
      <AshRain density={20} className='z-20' />

      <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between gap-2 mobile-safe-header mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-gray-500/30 bg-black/20 text-gray-300 hover:bg-black/40 hover:border-red-500/30 flex-shrink-0 mobile-safe-button'
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
                className='mx-auto mb-4 w-12 h-12 border-2 border-t-transparent border-red-400 rounded-full mobile-safe-button'
              />
              <p className='text-gray-300'>
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
                <Skull className='w-16 h-16 text-gray-500 mx-auto mb-6' />
              </motion.div>
              <h2 className='text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-gray-300 to-red-500'>
                {t('graveyard.empty.title', 'GRAVEYARD IS EMPTY')}
              </h2>
              <p className='text-gray-400 mt-2'>
                {t('graveyard.empty.description', 'No burned cubes found.')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }} // Appear after 1 second delay
            >
              <div className='nft-card-grid gap-3'>
                {tokenIds.slice(0, 20).map((id, idx) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.3, // Quick card appearance
                      delay: idx * 0.05,
                      ease: 'easeOut',
                    }}
                  >
                    <GraveyardCubeCard tokenId={id} index={idx} />
                  </motion.div>
                ))}
              </div>
              {tokenIds.length > 20 && (
                <div className='mt-8 text-center text-gray-400'>
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
      <GlueCube delay={8.8} className='fixed bottom-2 left-0 z-50' />
    </div>
  );
}
