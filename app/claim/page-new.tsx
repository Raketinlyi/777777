'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ParticleEffect } from '@/components/particle-effect';
import { useMobile } from '@/hooks/use-mobile';
import dynamic from 'next/dynamic';
import { TabNavigation } from '@/components/tab-navigation';
import { ClaimRewards } from '@/components/ClaimRewards';

const CoinsAnimation = dynamic(
  () => import('@/components/coins-animation').then(m => m.CoinsAnimation),
  { ssr: false }
);

export default function ClaimPage() {
  const isMobile = useMobile();

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 p-4'>
      {/* Coins animation */}
      <CoinsAnimation />

      {/* Background particles in green/gold tones */}
      <ParticleEffect
        count={isMobile ? 15 : 25}
        colors={['#10b981', '#34d399', '#fbbf24', '#f59e0b']}
        speed={isMobile ? 0.3 : 0.4}
        size={isMobile ? 4 : 6}
      />

      <div className='container mx-auto'>
        <header className='mb-8 flex items-center'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-green-500/30 bg-black/20 text-green-300 hover:bg-black/40'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Home
            </Button>
          </Link>
          <div className='ml-4 w-10 h-10 relative'>
            {/* Gold coin instead of logo */}
            <div className='w-10 h-10 rounded-full bg-gradient-radial from-yellow-400 via-yellow-500 to-amber-600 shadow-lg animate-pulse'></div>
            <div className='absolute inset-0 rounded-full bg-gradient-radial from-yellow-400/0 via-yellow-500/30 to-amber-600/50 blur-md'></div>
          </div>
        </header>

        <main>
          <ClaimRewards />
        </main>

        {/* Navigation + title */}
        <TabNavigation />
        <h1 className='text-3xl font-bold mt-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-400'>
          Claim Rewards 💰
        </h1>
        <p className='text-center text-green-300 mt-2'>
          Collect your well-earned CRA rewards! 🎉
        </p>

        <Link href='/' className='mt-8 flex justify-center'>
          <Button className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'>
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
