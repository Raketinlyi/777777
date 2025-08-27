'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Heart,
  Flame,
  Coins,
  SatelliteDish,
  Skull,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { useTranslation } from 'react-i18next';
import { TabNavigation } from '@/components/tab-navigation';
import { CrazyOctagon } from '@/components/CrazyOctagon';
import { SparkRain } from '@/components/SparkRain';
import { ReactiveAura } from '@/components/ReactiveAura';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';

import { useAccount } from 'wagmi';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { useNetwork } from '@/hooks/use-network';
import { NetworkSwitchProgress } from '@/components/NetworkSwitchProgress';


const UserNFTsPreview = dynamic(
  () => import('@/components/UserNFTsPreview').then(m => m.UserNFTsPreview),
  { ssr: false }
);

// Dynamic imports of heavy animations with conditional loading
const NewCubeIntro = dynamic(
  () => import('@/components/NewCubeIntro').then(m => ({ default: m.NewCubeIntro })),
  { ssr: false }
);
const FireAnimation = dynamic(
  () =>
    import('@/components/fire-animation').then(m => ({
      default: m.FireAnimation,
    })),
  { ssr: false }
);
const CoinsAnimation = dynamic(
  () =>
    import('@/components/coins-animation').then(m => ({
      default: m.CoinsAnimation,
    })),
  { ssr: false }
);

const ParticleEffect = dynamic(
  () =>
    import('@/components/particle-effect').then(m => ({
      default: m.ParticleEffect,
    })),
  { ssr: false }
);

export default function HomePage() {
  // Use translation hook
  const { t } = useTranslation();
  const { isMobile } = usePerformanceContext();

  const { isConnected: connected } = useAccount();
  const { isApeChain, isSwitching, switchAttempts, forceSwitchToApeChain } =
    useNetwork();
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Always show all effects
  const shouldShowParticles = true;
  const particleCount = 15;
  const animationIntensity = 1.0;

  useEffect(() => {
    // Ensure we're on client side
    setIsClient(true);

    // Set a maximum loading time to prevent infinite loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Animation variants
  const animationVariants = {
    lite: {
      hover: { scale: 1.01 },
      tap: { scale: 0.99 },
      transition: { duration: 0.1 },
    },
    full: {
      hover: { scale: 1.02, y: -2 },
      tap: { scale: 0.98 },
      transition: { duration: 0.2, type: 'spring' as const, stiffness: 400 },
    },
  };

  const currentVariant = animationVariants.full;

  // Always animate
  const shouldAnimate = true;

  // Helper to render main CTA buttons that require ApeChain
  const renderActionButton = (
    href: string,
    label: string,
    extra?: React.ReactNode
  ) => {
    if (!isApeChain) {
      return ( // The button to switch network
        <Button
          onClick={() => {
            void forceSwitchToApeChain();
          }}
          className='w-full h-12 text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-orange-600'
        >
          🔄 Switch to ApeChain
        </Button>
      );
    }
    return (
      <Link href={href} className='relative z-10 mt-auto block'>
        <Button className='neon-button w-full flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-fuchsia-500/40 hover:-translate-y-1'>
          {extra}
          {label}
        </Button>
      </Link>
    );
  };

  // Rendering loading screen
  if (isLoading || !isClient) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 px-4'>
        {/* Glow + spinner + logo */}
        <div className='relative mb-8'>
          <div className='absolute inset-0 w-32 h-32 md:w-40 md:h-40 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-purple-500/20 blur-2xl' />
          <div className='w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-purple-400/30 border-t-purple-400/90 animate-spin' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <Image
              src='/favicon.ico'
              alt='CrazyCube Logo'
              width={128}
              height={128}
              className='object-contain drop-shadow-[0_0_12px_rgba(139,92,246,.6)]'
              sizes='(max-width: 768px) 35vw, 128px'
            />
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='text-center text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-400 to-purple-200'
        >
          {t?.('loading', 'Loading...')}
  </motion.div>

        {/* Subtitle with gentle pulse and dots */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          className='mt-2 text-center text-sm md:text-base text-purple-200/80 max-w-[22rem]'
        >
          {t?.('loadingSubtitle', 'Preparing your CrazyCube experience')}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
          >
            …
          </motion.span>
        </motion.p>
      </div>
    );
  }

  return (
    <div
      className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative'
      style={{
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
      }}
    >
      {/* Global spark rain overlay (disabled on mobile to avoid layout shifts) */}
      {!isMobile && <SparkRain />}
      {/* Adding particle effect - reduced quantity */}
      {shouldShowParticles && !isMobile && (
        <ParticleEffect
          count={particleCount}
          colors={['#8B5CF6', '#A78BFA', '#C084FC', '#DDD6FE']}
          speed={animationIntensity}
          size={isMobile ? 3 : 4}
        />
      )}

      {/* Noise texture for background */}
      <div className='absolute inset-0 bg-blue-noise opacity-5 mix-blend-soft-light'></div>

      {/* Header */}
      <header className='relative z-10 mobile-header-fix mobile-safe-layout px-4 py-2'>
        <div className='mobile-header-spacing'>
          <div className='flex items-center justify-between w-full'>
            <CrazyOctagon />

            {/* Wallet connection */}
            <div className='flex flex-col items-end gap-2 flex-shrink-0'>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className='relative z-10 container mx-auto px-4 py-16'>
        {/* Tab navigation */}
        <div className='mb-16'>
          <div data-ignite-target className='hidden' />
          <TabNavigation />
        </div>

    {/* Hero section with new intro animation */}
        <div className='flex flex-col items-center justify-center mb-24'>
          <div
            className={`w-full relative ${isMobile ? 'h-[260px]' : 'h-[560px]'}`}
          >
      <NewCubeIntro height={isMobile ? 260 : 560} />
          </div>
        </div>

        {/* balance info hidden per new design */}

        {/* Network status and wallet connection section removed per latest design */}

        {/* Network Switch Progress */}
        {connected && (
          <div className='mb-16'>
            <NetworkSwitchProgress
              isSwitching={isSwitching}
              switchAttempts={switchAttempts}
              maxAttempts={5}
              isApeChain={isApeChain}
              onForceSwitch={forceSwitchToApeChain}
            />
          </div>
        )}

        {/* User NFTs Preview */}
        <div className='mb-16'>
          <UserNFTsPreview />
        </div>



        {/* Main Grid - OPTIMIZED */}
        <div
          className='grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 2xl:gap-8 mb-12'
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {/* Breed Section - CUBE - OPTIMIZED */}
          <motion.div data-card-type="breed"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-violet-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Neon reactive aura for Breed */}
            <ReactiveAura tint='fuchsia' intensity={1.1} />
            {/* Animated flying red hearts */}
            {(
              <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={`heart-${i}`}
                    className='absolute text-pink-400/80'
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                      opacity: [0, 0.7, 0],
                      scale: [0.7, 1.3, 0.7],
                      y: [-30, 30, -30],
                    }}
                    transition={{
                      duration: 3.5 + Math.random() * 2.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: Math.random() * 3,
                    }}
                  >
                    <Heart className='w-5 h-5' fill='currentColor' />
          </motion.div>
                ))}
              </div>
            )}

            <div className='flex items-center mb-4 relative z-10'>
              <Heart className='w-8 h-8 text-pink-400 mr-3' fill='currentColor' />
              <h2 className='heading-3 crypto-title text-gradient-crypto holo-underline glitch-soft'>
                {t('sections.breed.title', 'Breed NFTs (Cube Love!)')}
              </h2>
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.breed.description',
                'Combine two NFTs to resurrect one from the graveyard! Love is in the air! 💕'
              )}
            </p>
            <div data-ignite-target>
            {renderActionButton(
              '/breed',
              t('sections.breed.button', 'Breed NFTs')
            )}
            </div>

            {/* Pulsating pink glow */}
            <motion.div
              className='absolute inset-0 bg-gradient-radial from-pink-400/20 to-transparent rounded-2xl'
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>

          {/* Burn Section - FIRE - OPTIMIZED */}
          <motion.div data-card-type="burn"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Neon reactive aura for Burn */}
            <ReactiveAura tint='orange' intensity={1.15} />
            {/* Add FireAnimation component with reduced intensity */}
            {<FireAnimation intensity={animationIntensity} />}

            <div className='flex items-center mb-4 relative z-10'>
              <Flame className='w-8 h-8 text-purple-400 mr-3' />
              <h2 className='heading-3 crypto-title text-gradient-crypto holo-underline glitch-soft'>
                {t('sections.burn.title', 'Burn NFT (Roast the Cube!)')}
              </h2>
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.burn.description',
                'Burn NFT and get CRA tokens! Epic scene of a fiery grill with NFTs flying in screaming: "Tell my mom I love her!"'
              )}
            </p>
            <div data-ignite-target>
            {renderActionButton(
              '/burn',
              t('sections.burn.button', 'Burn NFT'),
              <div className='btn-flames mr-2' />
            )}
            </div>
          </motion.div>

          {/* Claim Section - GOLD - OPTIMIZED */}
          <motion.div data-card-type="claim"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-indigo-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Neon reactive aura for Claim */}
            <ReactiveAura tint='amber' intensity={1.1} />
            {/* Gold coins animation */}
            {<CoinsAnimation />}

            <div className='flex items-center mb-4 relative z-10'>
              <Coins className='w-8 h-8 text-indigo-400 mr-3' />
              <h2 className='heading-3 crypto-title text-gradient-crypto holo-underline glitch-soft'>
                {t('sections.claim.title', "Claim Rewards (Where's my CRA?)")}
              </h2>
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.claim.description',
                'A cube with huge sad eyes shouts: "Claim me and get your CRA!"'
              )}
            </p>
            <div data-ignite-target>
            {renderActionButton(
              '/claim',
              t('sections.claim.button', 'Claim')
            )}
            </div>
          </motion.div>

          {/* Ping Section */}
          <motion.div data-card-type="ping"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-blue-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Neon reactive aura for Ping */}
            <ReactiveAura tint='sky' intensity={1.05} />
            {/* Blue coins animation for ping - always show */}
            <CoinsAnimation />

            <div className='flex items-center mb-4 relative z-10'>
              <SatelliteDish className='w-8 h-8 text-blue-400 mr-3' />
              <h2 className='heading-3 crypto-title text-gradient-crypto holo-underline glitch-soft'>
                {t('sections.ping.title', 'Ping Cubes (Keep them Alive)')}
              </h2>
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.ping.description',
                "Send a heartbeat to your cubes so they don't drift into the void."
              )}
            </p>
            <div data-ignite-target>
            {renderActionButton(
              '/ping',
              t('sections.ping.button', 'Ping Now'),
              <SatelliteDish className='w-4 h-4 mr-2' />
            )}
            </div>
          </motion.div>

          {/* Graveyard Section */}
          <motion.div data-card-type="graveyard"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Subtle aura for Graveyard */}
            <ReactiveAura tint='purple' intensity={0.6} />
            <div className='flex items-center mb-4 relative z-10'>
              <Skull className='w-8 h-8 text-purple-400 mr-3' />
              <h2 className='heading-3 crypto-title text-gradient-crypto holo-underline glitch-soft'>
                {t('sections.graveyard.title', 'Graveyard')}
              </h2>
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.graveyard.description',
                'See your burned cubes, mourn them, and claim their CRA rewards.'
              )}
            </p>
            <div data-ignite-target>
            {renderActionButton(
              '/graveyard',
              t('sections.graveyard.button', 'Enter Graveyard'),
              <Skull className='w-5 h-5 mr-2' />
            )}
            </div>

            {/* Floating skulls */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`skull-${i}`}
                  className='absolute text-purple-400/30'
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [0.5, 1.1, 0.5],
                    y: [-10, 10, -10],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random() * 5,
                  }}
                >
                  <Skull className='w-4 h-4' />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Game Section - 3D CUBE GAME */}
          <motion.div data-card-type="game"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-indigo-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Neon reactive aura for Game */}
            <ReactiveAura tint='emerald' intensity={0.9} />
            <p className='body-text crypto-body mb-4 relative z-10 flex-1'>
              {t(
                'sections.game.description',
                'Interactive Minecraft-style game with an open crazy world, with crazy, amazing physics and gameplay! COMING SOON!'
              )}
            </p>

            {/* Floating cubes */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={`cube-${i}`}
                  className='absolute text-indigo-400/40'
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 1.2, 0.5],
                    rotate: [0, 180, 360],
                    y: [-15, 15, -15],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random() * 3,
                  }}
                >
                  <div className='w-3 h-3 bg-indigo-400 transform rotate-45'></div>
                </motion.div>
              ))}
            </div>
            <div className='mt-auto'>
              <div data-ignite-target>
              {renderActionButton(
                '/game',
                t('sections.game.button', 'Play Game'),
                <span className='w-5 h-5 mr-2 flex items-center justify-center'>
                  <svg
                    className='animate-pulse'
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='none'
                  >
                    <path
                      d='M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10-14v10a2 2 0 1 1-2-2V7h-4V3h6Z'
                      fill='#8B5CF6'
                    />
                  </svg>
                </span>
              )}
              </div>
            </div>
          </motion.div>

          {/* New Bridge NFT Card */}
          <motion.div data-card-type="bridge"
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
              transition: currentVariant.transition,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-violet-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Neon reactive aura for Bridge */}
            <ReactiveAura tint='cyan' intensity={1.1} />
            <p className='body-text crypto-body mb-4 relative z-10 flex-1'>
              {t(
                'sections.bridge.description',
                'Transfer your NFTs between networks quickly and safely! Bridge for your cubes: expand your possibilities and participate in new worlds.'
              )}
            </p>
            <div className='mt-auto'>
              <div data-ignite-target>
              {renderActionButton(
                '/bridge',
                t('sections.bridge.button', 'Bridge'),
                <span className='w-7 h-5 mr-2 flex items-center justify-center relative'>
                  {/* Bridge */}
                  <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
                    <path
                      d='M2 10h16M10 2v16'
                      stroke='#8B5CF6'
                      strokeWidth='2'
                      strokeLinecap='round'
                    />
                  </svg>
                  {/* Animated dot */}
                  <motion.div
                    className='absolute top-1 left-0 w-2 h-2 rounded-full bg-purple-400 shadow-lg'
                    animate={{ x: [0, 16, 0] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      repeatType: 'loop',
                    }}
                  />
                </span>
              )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer - OPTIMIZED */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className='text-center text-purple-400 mt-8'
      >
        <motion.p
          {...(shouldAnimate && {
            whileHover: { scale: 1.05 },
            transition: { duration: 0.1 },
          })}
          className='mt-2 text-sm'
        >
          {t(
            'footer.crashMessage',
            'If the site crashed, the cube went out for pizza'
          )}{' '}
          🍕
        </motion.p>

        <motion.p
          {...(shouldAnimate && {
            whileHover: { color: '#00D4FF' },
            transition: { duration: 0.1 },
          })}
          className='mt-2 text-xs'
        >
          {t('footer.madeWith', 'Made with ❤️ for the CrazyCube community')}
        </motion.p>
      </motion.footer>

    </div>
  );
}
