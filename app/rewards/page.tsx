﻿'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { TabNavigation } from '@/components/tab-navigation';
import { ClaimRewards } from '@/components/ClaimRewards';

const CoinsAnimation = dynamic(
  () => import('@/components/coins-animation').then(m => m.CoinsAnimation),
  { ssr: false }
);

export default function RewardsPage() {
  const { t } = useTranslation();

  return (
    <div className='min-h-screen mobile-content-wrapper relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4'>
      {/* Full screen gradient background with more depth */}
      <div className='fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900' />
      
      {/* Holographic data grid overlay */}
      <div className='fixed inset-0 -z-5 opacity-20'>
        <div className='absolute inset-0' style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Digital particle effects */}
      <CoinsAnimation intensity={0.25} theme='gold' />
      <CoinsAnimation intensity={0.75} theme='blue' />
      
      <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-slate-400/50 bg-slate-800/60 text-slate-100 hover:bg-slate-700/70 mobile-safe-button backdrop-blur-sm'
            >
              <ArrowLeft className='mr-2 w-4 h-4' />
              {t('navigation.home', 'Home')}
            </Button>
          </Link>
          <TabNavigation />
          <WalletConnect />
        </header>

        {/* Page Title */}
        <div className='text-center mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2'>
            {t('sections.rewards.title', 'Claim Your Rewards')}
          </h1>
          <p className='text-slate-300 text-sm md:text-base'>
            {t('sections.rewards.description', 'Collect OCTA rewards from your burned NFTs')}
          </p>
        </div>

        <main className='relative'>
          {/* Holographic panel with scan line effect */}
          <div className='relative z-10 rounded-2xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur-md shadow-[0_8px_40px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/20 p-4 overflow-hidden'>
            {/* Scan line effect */}
            <div className='absolute inset-0 pointer-events-none'>
              <div className='absolute top-0 left-0 right-0 h-1 bg-cyan-400/40 animate-pulse' 
                style={{
                  boxShadow: '0 0 20px rgba(6,182,212,0.6)',
                  animation: 'scanLine 3s linear infinite',
                  animationDelay: '1s'
                }} />
            </div>
            <ClaimRewards />
          </div>
        </main>
        <style jsx global>{`
          @keyframes scanLine {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes animated-stripes {
            0% { background-position: 0 0; }
            100% { background-position: 56px 0; }
          }
          .animated-stripes {
            background-image: linear-gradient(45deg, var(--stripe-color) 25%, transparent 25%, transparent 50%, var(--stripe-color) 50%, var(--stripe-color) 75%, transparent 75%, transparent 100%);
            background-size: 56px 56px;
            animation: animated-stripes 30s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
