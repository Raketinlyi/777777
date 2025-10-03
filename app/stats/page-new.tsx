'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ParticleEffect } from '@/components/particle-effect';
import { useMobile } from '@/hooks/use-mobile';
import { StatsAnimation } from '@/components/stats-animation';
import { TabNavigation } from '@/components/tab-navigation';
import { GameDashboard } from '@/components/GameDashboard';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Subgraph removed per request — live subgraph UI is disabled
import { StatsGrid } from '@/components/web3/stats-grid';
import { BurnReviveChart } from '@/components/web3/burn-revive-chart';
import { RewardsChart } from '@/components/web3/rewards-chart';
import { useTranslation } from 'react-i18next';
import NFTInspectorFixed from '@/components/web3/nft-inspector-fixed';
import ContractTest from '@/components/web3/contract-test';

export default function StatsPage() {
  const isMobile = useMobile();
  const { address } = useAccount();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4'>
      {/* Stats animation */}
      <StatsAnimation />

      {/* Background particles in purple/cyan tones */}
      <ParticleEffect
        count={isMobile ? 20 : 30}
        colors={['#8b5cf6', '#a78bfa', '#06b6d4', '#0891b2']}
        speed={isMobile ? 0.4 : 0.5}
        size={isMobile ? 5 : 7}
      />

      <div className='container mx-auto'>
        <header className='mb-8 flex items-center'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-purple-500/30 bg-black/20 text-purple-300 hover:bg-black/40'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Home
            </Button>
          </Link>
          <div className='ml-4 w-10 h-10 relative'>
            {/* Stats icon instead of logo */}
            <div className='w-10 h-10 rounded-full bg-gradient-radial from-purple-400 via-purple-500 to-indigo-600 shadow-lg animate-pulse flex items-center justify-center'>
              <span className='text-white text-lg'>📊</span>
            </div>
            <div className='absolute inset-0 rounded-full bg-gradient-radial from-purple-400/0 via-purple-500/30 to-indigo-600/50 blur-md'></div>
          </div>
        </header>

        <main>
          <GameDashboard />
        </main>

        {/* Contract Connection Test */}
        <div className='mt-8'>
          <ContractTest />
        </div>

        {/* NFT Inspector Section */}
        <div className='mt-8'>
          <NFTInspectorFixed />
        </div>

        {/* Navigation + title */}
        <TabNavigation />
        <h1 className='text-3xl font-bold mt-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400'>
          Game Statistics 📊
        </h1>
        <p className='text-center text-purple-300 mt-2'>
          Track the chaos and see who&apos;s winning the cube game!
        </p>

        <Link href='/' className='mt-8 flex justify-center'>
          <Button className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'>
            Home
          </Button>
        </Link>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className='mt-8'
        >
          <TabsList className='mb-4'>
            <TabsTrigger value='overview'>
              {t('stats.tabs.overview', 'Overview')}
            </TabsTrigger>
            {/* Subgraph tab removed */}
            <TabsTrigger value='charts'>
              {t('stats.tabs.charts', 'Charts')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview'>
            <StatsGrid />
          </TabsContent>

          {/* Subgraph tab removed */}

          <TabsContent value='charts'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <BurnReviveChart />
              <RewardsChart />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
