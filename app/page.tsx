'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, type TargetAndTransition } from 'framer-motion';
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
import HeaderBrand from '@/components/HeaderBrand';
import { SparkRain } from '@/components/SparkRain';
import { ReactiveAura } from '@/components/ReactiveAura';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import NeonTitle from '@/components/NeonTitle';
import FloatingShapes from '@/components/FloatingShapes';
import DustParticles from '@/components/DustParticles';

import { useAccount, useSwitchChain } from 'wagmi';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { monadChain } from '@/config/chains';

type ShelfStyle = {
  rotate?: number;
  x?: number;
  y?: number;
  skewX?: number;
  skewY?: number;
  scale?: number;
  opacity?: number;
};

type WindowWithShelfTilt = Window & {
  __shelfTilt?: number;
};

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const DIAGONAL_CRACKS = [
  { id: 'diag-1', left: '12%', baseRotate: 25, tiltFactor: 0.6, height: '65%', delay: 0.25 },
  { id: 'diag-2', left: '25%', baseRotate: 15, tiltFactor: 1, height: '60%', delay: 0.3 },
  { id: 'diag-3', left: '37%', baseRotate: 30, tiltFactor: 0.4, height: '58%', delay: 0.45 },
  { id: 'diag-4', left: '50%', baseRotate: -10, tiltFactor: 0.3, height: '55%', delay: 0.55 },
  { id: 'diag-5', left: '60%', baseRotate: -20, tiltFactor: 0.5, height: '50%', delay: 0.7 },
  { id: 'diag-6', left: '72%', baseRotate: -28, tiltFactor: 0.6, height: '48%', delay: 0.8 },
  { id: 'diag-7', left: '85%', baseRotate: -15, tiltFactor: 1, height: '55%', delay: 0.95 },
  { id: 'diag-8', left: '95%', baseRotate: -32, tiltFactor: 0.4, height: '45%', delay: 1.05 },
] as const;

const HORIZONTAL_CRACKS = [
  { id: 'horiz-1', top: '18%', width: '28%', left: '15%', delay: 0.9 },
  { id: 'horiz-2', top: '25%', width: '40%', left: '10%', delay: 1.0 },
  { id: 'horiz-3', top: '38%', width: '32%', left: '60%', delay: 1.1 },
  { id: 'horiz-4', top: '50%', width: '35%', left: '55%', delay: 1.2 },
  { id: 'horiz-5', top: '62%', width: '30%', left: '25%', delay: 1.3 },
  { id: 'horiz-6', top: '75%', width: '30%', left: '20%', delay: 1.4 },
  { id: 'horiz-7', top: '85%', width: '26%', left: '50%', delay: 1.5 },
] as const;

type SmallCrackConfig = {
  id: string;
  left: number;
  bottom: number;
  direction: 1 | -1;
  baseAngle: number;
  height: number;
  delay: number;
};

const SMALL_CRACKS: ReadonlyArray<SmallCrackConfig> = Array.from({ length: 14 }, (_, index) => ({
  id: `small-${index}`,
  left: 20 + index * 12,
  bottom: 10 + index * 8,
  direction: index % 2 === 0 ? 1 : -1,
  baseAngle: 30 + index * 5,
  height: 8 + index * 2,
  delay: 1.5 + index * 0.1,
}));

const MONAD_PARTICLE_COLORS = ['bg-purple-400/60', 'bg-violet-400/60', 'bg-indigo-400/60'] as const;

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

type HomePageInteractiveState = {
  isClient: boolean;
  isLoading: boolean;
  loadingProgress: number;
  shelfTilt: number;
  glitchEffect: boolean;
  shakeIntensity: number;
};

const useHomePageInteractiveState = (): HomePageInteractiveState => {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [shelfTilt, setShelfTilt] = useState(0);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  useEffect(() => {
    setIsClient(true);

    let tiltInterval: ReturnType<typeof setInterval> | undefined;
    let swayInterval: ReturnType<typeof setInterval> | undefined;
    const shelfWindow = window as WindowWithShelfTilt;

    const shelfEffectTimer = setTimeout(() => {
      let tiltValue = 0;
      tiltInterval = setInterval(() => {
        tiltValue += 0.1;
        if (tiltValue >= 2) {
          if (tiltInterval) {
            clearInterval(tiltInterval);
            tiltInterval = undefined;
          }

          swayInterval = setInterval(() => {
            const randomTilt = -1.5 + Math.random() * 3;
            setShelfTilt(randomTilt);
            shelfWindow.__shelfTilt = randomTilt;
          }, 8000);

          return;
        }
        setShelfTilt(tiltValue);
        shelfWindow.__shelfTilt = tiltValue;
      }, 100);
    }, 3000);

    const glitchTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchEffect(true);
        setTimeout(() => setGlitchEffect(false), 150);
      }
    }, 15000);

    const handleShake: EventListener = () => {
      setShakeIntensity(3);
      setTimeout(() => setShakeIntensity(0), 500);
    };

    window.addEventListener('card-hover', handleShake);

    const progressTimer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.random() * 30 + 10;
      });
    }, 100);

    const maxTimer = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => setIsLoading(false), 300);
    }, 2000);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(maxTimer);
      clearTimeout(shelfEffectTimer);
      clearInterval(glitchTimer);
      if (tiltInterval) {
        clearInterval(tiltInterval);
      }
      if (swayInterval) {
        clearInterval(swayInterval);
      }
      window.removeEventListener('card-hover', handleShake);
    };
  }, []);

  return {
    isClient,
    isLoading,
    loadingProgress,
    shelfTilt,
    glitchEffect,
    shakeIntensity,
  };
};

type GlitchOverlayProps = {
  enabled: boolean;
};

const GlitchOverlay = ({ enabled }: GlitchOverlayProps) => {
  if (!enabled) {
    return null;
  }

  return (
    <motion.div
      className='fixed inset-0 pointer-events-none z-50 mix-blend-screen'
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.3, 0.1, 0.4, 0],
        x: [-2, 2, -1, 3, 0],
      }}
      transition={{ duration: 0.15 }}
    >
      <div
        className='absolute inset-0 bg-red-500 opacity-20'
        style={{ transform: 'translateX(-2px)' }}
      />
      <div
        className='absolute inset-0 bg-cyan-500 opacity-20'
        style={{ transform: 'translateX(2px)' }}
      />
    </motion.div>
  );
};

type BackgroundEffectsProps = {
  isMobile: boolean;
  shouldShowParticles: boolean;
};

const BackgroundEffects = ({ isMobile, shouldShowParticles }: BackgroundEffectsProps) => (
  <>
    <div
      className='fixed inset-0 pointer-events-none z-[2]'
      style={{
        background:
          'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.3) 100%)',
        mixBlendMode: 'multiply',
      }}
    />

    <FloatingShapes />

    {!isMobile && (
      <div style={{ opacity: 0.6 }}>
        <SparkRain />
      </div>
    )}

    {shouldShowParticles && !isMobile && (
      <ParticleEffect
        count={8}
        colors={['#8B5CF6', '#A78BFA', '#C084FC', '#DDD6FE']}
        speed={0.5}
        size={3}
      />
    )}

    <div
      className='absolute inset-0 opacity-[0.07] mix-blend-soft-light'
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
        backgroundSize: '12px 12px',
      }}
    />

    <DustParticles count={isMobile ? 15 : 30} isMobile={isMobile} />
  </>
);

type CracksOverlayProps = {
  showCracks: boolean;
  shelfTilt: number;
};

const CracksOverlay = ({ showCracks, shelfTilt }: CracksOverlayProps) => {
  if (!showCracks) {
    return null;
  }

  return (
    <div className='fixed inset-0 pointer-events-none z-[5] overflow-hidden'>
      <motion.div
        className='absolute bottom-0 left-1/2 w-1 origin-bottom -translate-x-1/2'
        style={{
          background:
            'linear-gradient(to top, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow: '0 0 10px rgba(255,255,255,0.2)',
          mixBlendMode: 'overlay',
          filter: 'blur(0.5px)',
        }}
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: '100%',
          opacity: 0.6,
          rotate: shelfTilt * 0.5,
        }}
        transition={{
          height: { duration: 2, ease: 'easeOut' },
          rotate: { duration: 2.5, ease: [0.34, 1.56, 0.64, 1] },
        }}
      />

      {DIAGONAL_CRACKS.map(crack => {
        const rotation = crack.baseRotate + shelfTilt * crack.tiltFactor;
        return (
          <motion.div
            key={crack.id}
            className='absolute bottom-0 w-0.5 origin-bottom'
            style={{
              left: crack.left,
              background:
                'linear-gradient(to top, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: '0 0 6px rgba(255,255,255,0.15)',
              mixBlendMode: 'overlay',
            }}
            initial={{ height: 0, opacity: 0, rotate: rotation }}
            animate={{
              height: crack.height,
              opacity: 0.5,
              rotate: rotation,
            }}
            transition={{
              duration: 1.5,
              delay: crack.delay,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {HORIZONTAL_CRACKS.map(crack => (
        <motion.div
          key={crack.id}
          className='absolute h-0.5'
          style={{
            top: crack.top,
            left: crack.left,
            background:
              'linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 0 5px rgba(255,255,255,0.15)',
            mixBlendMode: 'overlay',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: crack.width,
            opacity: 0.4,
            rotate: shelfTilt * 0.3,
          }}
          transition={{
            duration: 1.2,
            delay: crack.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {SMALL_CRACKS.map(crack => (
        <motion.div
          key={crack.id}
          className='absolute w-px origin-bottom'
          style={{
            left: `${crack.left}%`,
            bottom: `${crack.bottom}%`,
            background: 'rgba(255,255,255,0.2)',
            mixBlendMode: 'overlay',
          }}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: `${crack.height}%`,
            opacity: 0.3,
            rotate: crack.direction * crack.baseAngle + shelfTilt * 0.2,
          }}
          transition={{
            duration: 1,
            delay: crack.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

type LoadingScreenProps = {
  progress: number;
  title: string;
  subtitle: string;
};

const LoadingScreen = ({ progress, title, subtitle }: LoadingScreenProps) => (
  <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 px-4'>
    <div className='relative mb-8'>
      <div className='absolute inset-0 w-32 h-32 md:w-40 md:h-40 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-purple-500/20 blur-2xl' />
      <div className='w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-purple-400/30 border-t-purple-400/90 animate-spin' />
        <div className='absolute inset-0 flex items-center justify-center'>
        <Image
          src='/icons/favicon-180x180.png'
          alt='CrazyOctagon Logo'
          width={180}
          height={180}
          className='object-contain drop-shadow-[0_0_12px_rgba(139,92,246,.6)]'
          sizes='(max-width: 768px) 45vw, 180px'
        />
      </div>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='text-center text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-400 to-purple-200'
    >
      {title}
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      className='mt-2 text-center text-sm md:text-base text-purple-200/80 max-w-[22rem]'
    >
      {subtitle}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
      >
        …
      </motion.span>
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className='mt-6 w-full max-w-xs'
    >
      <div className='bg-purple-900/30 rounded-full h-2 overflow-hidden border border-purple-500/30'>
        <motion.div
          className='h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full'
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      <motion.p
        className='text-center text-xs text-purple-300 mt-2'
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      >
        {Math.round(progress)}%
      </motion.p>
    </motion.div>
  </div>
);

export default function HomePage() {
  // Use translation hook
  const { t } = useTranslation();
  const { isMobile } = usePerformanceContext();
  const chainName = monadChain.name;
  const pairTokenSymbol = monadChain.nativeCurrency.symbol;

  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Check if we are on Monad Testnet
  const isMonadChain = chainId === monadChain.id;
  
  // Function to switch to Monad Testnet
  const forceSwitchToMonadChain = () => {
    if (switchChain) {
      switchChain({ chainId: monadChain.id });
    }
  };
  const {
    isClient,
    isLoading,
    loadingProgress,
    shelfTilt,
    glitchEffect,
    shakeIntensity,
  } = useHomePageInteractiveState();
  const showCracks = true; // ENABLED - stable version

  // Effect optimization for devices
  const shouldShowParticles = !isMobile; // Disable on mobile
  const animationIntensity = isMobile ? 0.5 : 1.0; // Lower intensity

  const sparkParticles = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        id: createId('spark'),
        left: 15 + Math.random() * 70,
        top: 15 + Math.random() * 70,
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50,
        duration: 1.8 + Math.random() * 0.8,
        delay: Math.random() * 2.5,
      })),
    []
  );

  const monadParticles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: createId('monad'),
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 3,
        colorClass: MONAD_PARTICLE_COLORS[index % MONAD_PARTICLE_COLORS.length],
      })),
    []
  );

  const heartParticles = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        id: createId('heart'),
        left: 10 + Math.random() * 80,
        top: 10 + Math.random() * 80,
        duration: 3.5 + Math.random() * 2.5,
        delay: Math.random() * 3,
      })),
    []
  );

  const goldParticles = useMemo(() => {
    const length = isMobile ? 6 : 10;
    return Array.from({ length }, () => ({
      id: createId('gold'),
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    }));
  }, [isMobile]);

  const skullParticles = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        id: createId('skull'),
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 4 + Math.random() * 3,
        delay: Math.random() * 5,
      })),
    []
  );

  const cubeParticles = useMemo(
    () =>
      Array.from({ length: 4 }, () => ({
        id: createId('cube'),
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 5 + Math.random() * 2,
        delay: Math.random() * 3,
      })),
    []
  );

  const footerParticles = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        id: createId('footer'),
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 4 + Math.random() * 2,
        delay: Math.random() * 3,
      })),
    []
  );

  // ENHANCED Animation variants - smoother and cooler
  const animationVariants = {
    mobile: {
      hover: { 
        scale: 1.03, 
        y: -3,
        boxShadow: '0 10px 30px -5px rgba(139, 92, 246, 0.4)'
      },
      tap: { scale: 0.97 },
      transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }, // Smoother curve
    },
    desktop: {
      hover: { 
        scale: 1.05, 
        y: -8,
        rotateX: 2, // Reduced for smoothness
        rotateY: 2, // Reduced for smoothness
        boxShadow: '0 20px 50px -10px rgba(139, 92, 246, 0.5)'
      },
      tap: { scale: 0.98 },
      transition: { 
        duration: 0.4, 
        type: 'spring' as const, 
        stiffness: 300, // Softer spring
        damping: 20 // More damping
      },
    },
    reduced: {
      hover: { scale: 1.01 },
      tap: { scale: 0.99 },
      transition: { duration: 0.1 },
    },
  };

  const currentVariant = isMobile 
    ? animationVariants.mobile 
    : animationVariants.desktop;

  // Always animate
  const shouldAnimate = true;

  // 🎨 CREATIVE "bookshelf shelves" effect - each card = shelf
  const getBrokenShelvesStyle = (index: number): ShelfStyle => {
    if (shelfTilt === 0) {
      // even at 0 a little chaos to make it noticeable
      const s = (n: number) => {
        const x = Math.sin((index + 1) * (n * 12.9898) + n * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      const n1 = s(1) * 2 - 1;
      const n2 = s(2) * 2 - 1;
      const n3 = s(3) * 2 - 1;
      const n4 = s(4) * 2 - 1;
      const n5 = s(5) * 2 - 1;
      const n6 = s(6) * 2 - 1;
      return {
        rotate: n1 * 1.5,
        x: n2 * (isMobile ? 1 : 3),
        y: n3 * (isMobile ? 1 : 3),
        skewX: n4 * 0.8,
        skewY: n5 * 0.8,
        scale: 1 + n6 * 0.01,
      };
    }

    // Deterministic noise by index for "scattered" shelves
    const s = (n: number) => {
      const x = Math.sin((index + 1) * (n * 12.9898) + n * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const n1 = s(1) * 2 - 1; // [-1,1]
    const n2 = s(2) * 2 - 1;
    const n3 = s(3) * 2 - 1;
    const n4 = s(4) * 2 - 1;
    const n5 = s(5) * 2 - 1;
    const n6 = s(6) * 2 - 1;

    // Base tilt from "bookshelf"
    const baseRotation = shelfTilt * (0.5 + Math.sin(index * 0.7) * 0.3);
    // Vertical shift from shelf
    const verticalShift = Math.sin(index * 1.2) * shelfTilt * 2;

    // Additional chaos
    const jitterRot = n1 * 3; // 
    const skewX = n2 * 1.6;
    const skewY = n3 * 1.6 + shelfTilt * 0.1;
    const jiggleX = n4 * (isMobile ? 2 : 6);
    const jiggleY = verticalShift + n5 * (isMobile ? 2 : 4);
    const scale = 1 + n6 * 0.02;

    return {
      rotate: baseRotation + jitterRot,
      x: jiggleX,
      y: jiggleY,
      skewX,
      skewY,
      scale,
    };
  };

  const mergeShelfStyle = (
    index: number,
    overrides: ShelfStyle = {}
  ): ShelfStyle => ({
    ...getBrokenShelvesStyle(index),
    ...overrides,
  });

  const shelfAnimate = (
    index: number,
    overrides?: ShelfStyle
  ): TargetAndTransition =>
    mergeShelfStyle(index, overrides ?? {}) as TargetAndTransition;

  // Helper to render main CTA buttons that require Monad Testnet
  const renderActionButton = (
    href: string,
    label: string,
    extra?: ReactNode
  ) => {
    if (!isMonadChain) {
      return ( // The button to switch network
        <Button
          onClick={() => {
            forceSwitchToMonadChain();
          }}
          className='w-full h-12 text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-orange-600'
        >
          🔄 Switch to Monad Testnet
        </Button>
      );
    }
    return (
      <Link href={href} className='relative z-10 mt-auto block'>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Button className='neon-button w-full flex items-center justify-center transition-all duration-300 hover:shadow-2xl hover:shadow-fuchsia-500/50 relative overflow-hidden group'>
            {/* УЛУЧШЕННЫЙ Gradient overlay на hover */}
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-purple-500/0 via-fuchsia-500/30 to-purple-500/0'
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            
            {/* УЛУЧШЕННЫЕ Sparks effect - больше и ярче */}
            <div className='absolute inset-0 pointer-events-none'>
              {sparkParticles.map(particle => (
                <motion.div
                  key={particle.id}
                  className='absolute w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50'
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                  }}
                  animate={{
                    x: [0, particle.x, 0],
                    y: [0, particle.y, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Infinity,
                    delay: particle.delay,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                />
              ))}
            </div>
            
            {/* Pulsing glow effect */}
            <motion.div
              className='absolute inset-0 bg-fuchsia-500/20 rounded-lg blur-xl'
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            <span className='relative z-10 flex items-center'>
              {extra}
              {label}
            </span>
          </Button>
        </motion.div>
      </Link>
    );
  };

  const loadingTitle = t?.('loading', 'Loading...') ?? 'Loading...';
  const loadingSubtitle =
    t?.('loadingSubtitle', 'Preparing your CrazyOctagon experience') ??
    'Preparing your CrazyOctagon experience';

  // Enhanced loading screen with progress bar
  if (isLoading || !isClient) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        title={loadingTitle}
        subtitle={loadingSubtitle}
      />
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
      {/* 🎨 WOW ЭФФЕКТЫ */}
      <GlitchOverlay enabled={glitchEffect} />
      <BackgroundEffects
        isMobile={isMobile}
        shouldShowParticles={shouldShowParticles}
      />
      <CracksOverlay showCracks={showCracks} shelfTilt={shelfTilt} />

      {/* Header - тоже перекашивается! */}
      <motion.header 
        className='relative z-10 mobile-header-fix mobile-safe-layout px-4 py-2'
        animate={{
          rotate: shelfTilt * 0.15,
          y: shelfTilt * 1.5,
        }}
        transition={{
          duration: 2.5,
          ease: [0.34, 1.56, 0.64, 1],
          type: 'spring',
          stiffness: 50,
          damping: 20
        }}
      >
        <div className='mobile-header-spacing'>
          <div className='flex items-center justify-between w-full'>
            {/* left spacer to keep layout when brand is centered separately */}
            <div className='w-20 md:w-28' />

            {/* Wallet connection */}
            <div className='flex flex-col items-end gap-2 flex-shrink-0'>
              <WalletConnect />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content - with tilted bookshelf effect + shake */}
      <motion.main 
        className='relative z-10 container mx-auto px-4 py-16'
        animate={{
          rotate: shelfTilt * 0.3, // All content tilts slightly
          x: shakeIntensity > 0 ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0] : 0,
          y: shakeIntensity > 0 ? [0, shakeIntensity, -shakeIntensity, shakeIntensity, 0] : 0,
        }}
        transition={{
          duration: shakeIntensity > 0 ? 0.5 : 2.5,
          ease: shakeIntensity > 0 ? 'easeInOut' : [0.34, 1.56, 0.64, 1],
          type: 'spring',
          stiffness: 50,
          damping: 20
        }}
      >
        {/* Top-center big brand overlay */}
        <div className='pointer-events-none relative'>
          <div className='absolute left-1/2 -translate-x-1/2 -top-14 md:-top-24 z-20'>
            <HeaderBrand className='scale-100 md:scale-[1.5]' />
          </div>
        </div>
        {/* Tab navigation - tilts! */}
        <motion.div 
          className='mb-16'
          animate={shelfAnimate(100, { rotate: shelfTilt * 0.25 })}
          transition={{
            duration: 2.5,
            ease: [0.34, 1.56, 0.64, 1],
            type: 'spring',
            stiffness: 50,
            damping: 20
          }}
        >
          <div data-ignite-target className='hidden' />
          <TabNavigation />
        </motion.div>

        {/* Hero section - квадратная адаптивная анимация - перекашиваетс��! */}
        <motion.div 
          className='flex flex-col items-center justify-center mb-24'
          animate={shelfAnimate(101, { rotate: shelfTilt * 0.2 })}
          transition={{
            duration: 2.5,
            ease: [0.34, 1.56, 0.64, 1],
            type: 'spring',
            stiffness: 50,
            damping: 20
          }}
        >
          <div
            className={`w-full relative ${
              isMobile ? 'h-[280px]' : 'h-[560px]'
            }`}
          >
            {/* Desktop: полная NewCubeIntro анимация */}
            {!isMobile && (
              <NewCubeIntro height={560} />
            )}
            
            {/* Mobile: квадратная версия как два прямоугольника */}
            {isMobile && (
              <motion.div 
                className='flex items-center justify-center h-full relative overflow-hidden rounded-2xl mx-4'
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533a7d 75%, #6d28d9 100%)'
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* Квадратная мобильная NewCubeIntro */}
                <div className='absolute inset-2 rounded-xl overflow-hidden'>
                  <NewCubeIntro height={240} />
                </div>
                
                {/* Дополнительная рамка для квадратной версии */}
                <div className='absolute inset-0 rounded-2xl ring-2 ring-purple-400/20 pointer-events-none' />
                
                {/* Monad-тематичные частицы на фоне */}
                <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                  {monadParticles.map(particle => (
                    <motion.div
                      key={particle.id}
                      className='absolute'
                      style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                      }}
                      animate={{
                        opacity: [0, 0.4, 0],
                        scale: [0.5, 1, 0.5],
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: particle.duration,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: particle.delay
                      }}
                    >
                      <div className={`w-1 h-1 rounded-full ${particle.colorClass} shadow-lg`} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
        {/* User NFTs Preview - перекашивается! */}
        <motion.div 
          className='mb-16'
          animate={shelfAnimate(8, { rotate: shelfTilt * 0.25 })}
          transition={{ duration: 1.5, type: 'spring', stiffness: 80, damping: 15 }}
        >
          <UserNFTsPreview />
        </motion.div>

        {/* Main Grid - ЭФФЕКТ ПЕРЕКОШЕННОГО ШКАФА */}
        <motion.section 
          className='grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 2xl:gap-8 mb-12'
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
          animate={{
            rotate: shelfTilt * 0.2, // Card section also tilts
          }}
          transition={{
            duration: 2.5,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          aria-label='Game features'
        >
          {/* Breed Section - CUBE - ОПТИМИЗИРОВАННЫЙ */}
          <motion.article 
            data-card-type="breed"
            initial={{ opacity: 0, y: 20 }}
            animate={shelfAnimate(4, { opacity: 1, y: 0 })}
            transition={{ duration: 0.5, delay: 0.5 }}
            {...(shouldAnimate && {
              whileHover: {
                ...currentVariant.hover,
                rotateY: [0, 5, -5, 0], // 3D swaying
              },
              whileTap: currentVariant.tap,
            })}
            onHoverStart={() => {
              // Триггерим легкую тряску при наведении
              if (Math.random() > 0.5) {
                window.dispatchEvent(new Event('card-hover'));
              }
            }}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ReactiveAura tint='fuchsia' intensity={1.1} />
            {/* Animated flying red hearts */}
            {(
              <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                {heartParticles.map(particle => (
                  <motion.div
                    key={particle.id}
                    className='absolute text-pink-400/80'
                    style={{
                      left: `${particle.left}%`,
                      top: `${particle.top}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                      opacity: [0, 0.7, 0],
                      scale: [0.7, 1.3, 0.7],
                      y: [-30, 30, -30],
                    }}
                    transition={{
                      duration: particle.duration,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: particle.delay,
                    }}
                  >
                    <Heart className='w-5 h-5' fill='currentColor' />
                  </motion.div>
                ))}
              </div>
            )}
            
            <div className='flex items-center mb-4 relative z-10'>
              <Heart className='w-8 h-8 text-pink-400 mr-3' fill='currentColor' />
              <NeonTitle 
                title={t('sections.breed.title', 'Breed NFTs (Octagon Love!)')} 
              />
            </div>
            
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.breed.description',
                'Combine two NFTs to resurrect one from the graveyard! Octagon love is in the air! 💕'
              )}
            </p>
            
            <div data-ignite-target>
              {renderActionButton(
                '/breed',
                t('sections.breed.button', 'Breed NFTs')
              )}
            </div>

            {/* Pulsating pink glow + световые блики */}
            <motion.div
              className='absolute inset-0 bg-gradient-radial from-pink-400/20 to-transparent rounded-2xl'
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            />
            
            {/* Световой блик проходящий по карточке */}
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent'
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: 'easeInOut',
              }}
            />
          </motion.article>

          {/* Burn Section - FIRE - ОПТИМИЗИРОВАННЫЙ */}
          <motion.article 
            data-card-type="burn"
            initial={{ opacity: 0, y: 20 }}
            animate={shelfAnimate(1, { opacity: 1, y: 0 })}
            transition={{ duration: 0.5, delay: 0.2 }}
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ReactiveAura tint='orange' intensity={1.15} />
            {<FireAnimation intensity={animationIntensity} />}

            <div className='flex items-center mb-4 relative z-10'>
              <Flame className='w-8 h-8 text-purple-400 mr-3' />
              <NeonTitle title={t('sections.burn.title', 'Burn NFT (Roast the Octagon!)')} />
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.burn.description',
                `Burn NFT to lock OCTA and accrue rewards. On claim we burn OCTA and you receive ${pairTokenSymbol} on ${chainName}.`
              )}
            </p>
            <div data-ignite-target>
              {renderActionButton(
                '/burn',
                t('sections.burn.button', 'Burn NFT'),
                <div className='btn-flames mr-2' />
              )}
            </div>
          </motion.article>

          {/* Claim Section - TREASURE THEMED with Golden Effects */}
          <motion.article 
            data-card-type="claim"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={shelfAnimate(2, { opacity: 1, y: 0, scale: 1 })}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            {...(shouldAnimate && {
              whileHover: {
                ...currentVariant.hover,
                boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.4)'
              },
            })}
            className='crypto-card group relative overflow-hidden backdrop-blur-xl p-4 md:p-6 flex flex-col justify-between shadow-2xl transition-all duration-500 border-2'
            style={{ 
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 50%, rgba(217, 119, 6, 0.1) 100%)',
              borderImage: 'linear-gradient(45deg, #fbbf24, #f59e0b, #d97706) 1',
              borderRadius: '1rem',
              boxShadow: '0 20px 40px -12px rgba(251, 191, 36, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Golden treasure effects */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {goldParticles.map(particle => (
                <motion.div
                  key={particle.id}
                  className='absolute'
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                  }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    rotateY: [0, 360],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: particle.delay,
                  }}
                >
                  <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg`} />
                </motion.div>
              ))}
            </div>
            {!isMobile && <CoinsAnimation />}

            <div className='flex items-center mb-4 relative z-10'>
              <Coins className='w-8 h-8 text-indigo-400 mr-3' />
              <NeonTitle title={t('sections.claim.title', 'Claim Rewards (receive pair token)')} />
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.claim.description',
                `Claim converts LP: OCTA is burned, you receive ${pairTokenSymbol} on ${chainName}.`
              )}
            </p>
            <div data-ignite-target>
              {renderActionButton(
                '/rewards',
                t('sections.claim.button', 'Claim')
              )}
            </div>
          </motion.article>

          {/* Ping Section */}
          <motion.article 
            data-card-type="ping"
            initial={{ opacity: 0, y: 20 }}
            animate={shelfAnimate(3, { opacity: 1, y: 0 })}
            transition={{ duration: 0.5, delay: 0.4 }}
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-blue-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ReactiveAura tint='sky' intensity={1.05} />
            <CoinsAnimation />

            <div className='flex items-center mb-4 relative z-10'>
              <SatelliteDish className='w-8 h-8 text-blue-400 mr-3' />
              <NeonTitle title={t('sections.ping.title', 'Ping Octagons (Keep them Alive)')} />
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.ping.description',
                "Send a heartbeat to your octagons so they don't drift into the void."
              )}
            </p>
            <div data-ignite-target>
              {renderActionButton(
                '/ping',
                t('sections.ping.button', 'Ping Now'),
                <SatelliteDish className='w-4 h-4 mr-2' />
              )}
            </div>
          </motion.article>

          {/* Graveyard Section */}
          <motion.article 
            data-card-type="graveyard"
            initial={{ opacity: 0, y: 20 }}
            animate={shelfAnimate(4, { opacity: 1, y: 0 })}
            transition={{ duration: 0.5, delay: 0.5 }}
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ReactiveAura tint='purple' intensity={0.6} />
            <div className='flex items-center mb-4 relative z-10'>
              <Skull className='w-8 h-8 text-purple-400 mr-3' />
              <NeonTitle title={t('sections.graveyard.title', 'Octagon Graveyard')} />
            </div>
            <p className='body-text crypto-body mb-6 relative z-10 flex-1'>
              {t(
                'sections.graveyard.description',
                `See your burned octagons, statuses and claim pending rewards in ${pairTokenSymbol}.`
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
              {skullParticles.map(particle => (
                <motion.div
                  key={particle.id}
                  className='absolute text-purple-400/30'
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [0.5, 1.1, 0.5],
                    y: [-10, 10, -10],
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: particle.delay,
                  }}
                >
                  <Skull className='w-4 h-4' />
                </motion.div>
              ))}
            </div>
          </motion.article>

          {/* Game Section - 3D CUBE GAME */}
          <motion.article 
            data-card-type="game"
            initial={{ opacity: 0, y: 20 }}
            animate={shelfAnimate(5, { opacity: 1, y: 0 })}
            transition={{ duration: 0.5, delay: 0.6 }}
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-indigo-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ReactiveAura tint='emerald' intensity={0.9} />
            <p className='body-text crypto-body mb-4 relative z-10 flex-1'>
              {t(
                'sections.game.description',
                'Interactive Minecraft-style game with an open crazy world, with crazy, amazing physics and gameplay! COMING SOON!'
              )}
            </p>

            {/* Floating cubes */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {cubeParticles.map(particle => (
                <motion.div
                  key={particle.id}
                  className='absolute text-indigo-400/40'
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 1.2, 0.5],
                    rotate: [0, 180, 360],
                    y: [-15, 15, -15],
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: particle.delay,
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
          </motion.article>

          {/* Bridge Section */}
          <motion.article 
            data-card-type="bridge"
            initial={{ opacity: 0, y: 20 }}
            animate={shelfAnimate(6, { opacity: 1, y: 0 })}
            transition={{ duration: 0.5, delay: 0.7 }}
            {...(shouldAnimate && {
              whileHover: currentVariant.hover,
              whileTap: currentVariant.tap,
            })}
            className='crypto-card group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-violet-400/30 backdrop-blur-lg p-4 md:p-6 flex flex-col justify-between shadow-xl shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-400/40'
            style={{ transformStyle: 'preserve-3d' }}
          >
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
          </motion.article>
          
        </motion.section>
      </motion.main>

      {/* Enhanced Footer with Animations */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={shelfAnimate(9, { opacity: 1, y: 0 })}
        transition={{ duration: 0.6, delay: 0.3 }}
        className='text-center text-purple-400 mt-12 relative'
      >
        <div className='absolute inset-0 -z-10 overflow-hidden'>
          {footerParticles.map(particle => (
            <motion.div
              key={particle.id}
              className='absolute'
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 0.5, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: particle.duration,
                repeat: Number.POSITIVE_INFINITY,
                delay: particle.delay
              }}
            >
              <div className='w-1 h-1 bg-purple-400/60 rounded-full' />
            </motion.div>
          ))}
        </div>
        
        <motion.p
          {...(shouldAnimate && {
            whileHover: { scale: 1.05, color: '#fbbf24' },
            transition: { duration: 0.2 },
          })}
          className='mt-2 text-sm font-medium'
        >
          {t(
            'footer.crashMessage',
            'If the site crashed, the cube went out for pizza'
          )}{' '}
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className='inline-block'
          >
            🍕
          </motion.span>
        </motion.p>

        <motion.p
          {...(shouldAnimate && {
            whileHover: { color: '#00D4FF', scale: 1.02 },
            transition: { duration: 0.2 },
          })}
          className='mt-2 text-xs'
        >
          {t('footer.madeWith', 'Made with')}{' '}
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className='inline-block text-red-500'
          >
            ❤️
          </motion.span>
          {' '}for the CrazyOctagon community
        </motion.p>
      </motion.footer>
    </div>
  );
}
