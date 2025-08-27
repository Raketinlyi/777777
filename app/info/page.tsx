'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Info,
  BarChart3,
  Activity,
  PieChart,
  TrendingUp,
  Flame,
  Coins,
  Database,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { TabNavigation } from '@/components/tab-navigation';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import dynamic from 'next/dynamic';
import { ParticleEffect } from '@/components/particle-effect';
import { useTranslation } from 'react-i18next';
import { useMobile } from '@/hooks/use-mobile';
import { ContractInfo } from '@/components/web3/contract-info';
import MarketTicker from '@/components/MarketTicker';
import { motion } from 'framer-motion';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { cn } from '@/lib/utils';
const NalaInfoCube = dynamic(
  () => import('@/components/NalaInfoCube').then(m => ({ default: m.default })),
  { ssr: false }
);

const DigitRain = dynamic(
  () => import('@/components/digit-rain').then(m => ({ default: m.default })),
  { ssr: false }
);
const StatsGrid = dynamic(
  () => import('@/components/web3/stats-grid').then(m => m.StatsGrid),
  { ssr: false }
);
const BurnReviveChart = dynamic(
  () =>
    import('@/components/web3/burn-revive-chart').then(m => m.BurnReviveChart),
  { ssr: false }
);
const RewardsChart = dynamic(
  () => import('@/components/web3/rewards-chart').then(m => m.RewardsChart),
  { ssr: false }
);
const TokenAllocationDonut = dynamic(
  () =>
    import('@/components/web3/token-allocation-donut').then(
      m => m.TokenAllocationDonut
    ),
  { ssr: false }
);

const Denis3LiveData = dynamic(
  () => import('@/components/web3/denis3-live-data'),
  { ssr: false }
);
const CRATokenInfo = dynamic(() => import('@/components/CRATokenInfo'), {
  ssr: false,
});
const ContractFullStats = dynamic(
  () =>
    import('@/components/web3/contract-full-stats').then(
      m => m.ContractFullStats
    ),
  { ssr: false }
);
const Denis3Analytics = dynamic(
  () => import('@/components/web3/denis3-analytics'),
  { ssr: false }
);
const NFTCooldownInspector = dynamic(
  () => import('@/components/web3/nft-cooldown-inspector'),
  { ssr: false }
);
const UserNftsList = dynamic(() => import('@/components/web3/user-nfts-list'), {
  ssr: false,
});
const CRABurnAnalytics = dynamic(
  () => import('@/components/web3/cra-burn-analytics'),
  { ssr: false }
);
const PlayerAnalytics = dynamic(
  () => import('@/components/web3/player-analytics'),
  { ssr: false }
);
const PerformanceInfo = dynamic(
  () =>
    import('@/components/performance-info').then(m => ({
      default: m.PerformanceInfo,
    })),
  { ssr: false }
);

// Add Coming Soon watermark component - transparent watermark
const ComingSoonWatermark = () => (
  <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-50'>
    <div className='bg-black/5 backdrop-blur-sm rounded-lg px-8 py-4 border border-white/10 mobile-safe-button'>
      <div className='text-white/30 text-4xl font-bold tracking-wider'>
        COMING SOON
      </div>
    </div>
  </div>
);

export default function InfoPage() {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const { isLiteMode } = usePerformanceContext();
  const [selectedTab, setSelectedTab] = useState('nft-inspector');

  // Show watermark for all tabs except NFT Inspector
  const showWatermark = selectedTab !== 'nft-inspector';

  return (
    <div
      className='min-h-screen mobile-content-wrapper bg-gradient-to-br from-violet-900 via-indigo-900 to-violet-900 p-4'
    >
      {/* Background effects - always show */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <ParticleEffect
          count={isMobile ? 15 : 30}
          colors={['#a78bfa', '#818cf8', '#60a5fa']}
          speed={isMobile ? 0.4 : 0.6}
          size={isMobile ? 3 : 5}
        />
        <DigitRain
          density={18}
          colors={['#a78bfa', '#818cf8', '#f472b6', '#facc15']}
        />
      </div>

      {/* Coming Soon Watermark */}
      {showWatermark && <ComingSoonWatermark />}

      <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between gap-2 mobile-safe-header mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-violet-500/30 bg-black/20 text-violet-300 hover:bg-black/40 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('navigation.returnHome', 'Home')}
            </Button>
          </Link>
          <div className='flex-1 flex justify-center min-w-0'>
            {!isMobile && <TabNavigation />}
          </div>
          <div className='flex items-center flex-shrink-0'>
            <WalletConnect />
          </div>
        </header>

        <main>
          <NalaInfoCube />

          {/* Title like in breed */}
          <div className='mt-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center'>
            <h1 className='text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-blue-400 whitespace-nowrap'>
              {t('info.title', 'Info & Analytics')}
            </h1>
          </div>

          {/* Contract info panel - reduced spacing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mt-4'
          >
            <ContractInfo />
            <div className='mt-4'>
              <MarketTicker />
            </div>
          </motion.div>

          {/* Main tabs - larger tabs */}
          <div className='mt-6'>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList
                className={cn(
                  'mb-6 bg-slate-800/50 p-1.5 backdrop-blur-sm',
                  isMobile && 'flex flex-wrap h-auto'
                )}
              >
                <TabsTrigger
                  value='nft-inspector'
                  className='data-[state=active]:bg-blue-600 text-base px-4 py-2.5'
                >
                  <Database className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.nftInspector', 'NFT Inspector')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='overview'
                  className='data-[state=active]:bg-violet-600 text-base px-4 py-2.5'
                >
                  <BarChart3 className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.tabs.overview', 'Overview')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='cra-token'
                  className='data-[state=active]:bg-orange-600 text-base px-4 py-2.5'
                >
                  <Coins className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.tabs.craaToken', 'CRAA Token')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='contract-stats'
                  className='data-[state=active]:bg-emerald-600 text-base px-4 py-2.5'
                >
                  <Database className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.tabs.contract', 'Contract Stats')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='subgraph'
                  className='data-[state=active]:bg-pink-600 text-base px-4 py-2.5'
                >
                  <Info className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.tabs.contractData', 'Live Data')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='denis3'
                  className='data-[state=active]:bg-cyan-600 text-base px-4 py-2.5'
                >
                  <Zap className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.tabs.liveAnalytics', 'Live Analytics')}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='system'
                  className='data-[state=active]:bg-gray-700 text-base px-4 py-2.5'
                >
                  <Activity className={cn('h-5 w-5', !isMobile && 'mr-2')} />
                  <span className={cn(isMobile && 'hidden')}>
                    {t('info.tabs.system', 'System')}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* NFT Inspector Tab */}
              <TabsContent value='nft-inspector'>
                <div className='grid grid-cols-1 gap-6'>
                  <NFTCooldownInspector />
                  <UserNftsList />

                  {/* Game Guide */}
                  <div className='space-y-8 mt-8'>
                    {/* Game Title */}
                    <Card className='p-6 bg-gradient-to-r from-violet-900/50 to-purple-900/50 border-violet-500/30 mobile-safe-button'>
                      <div className='text-center'>
                        <h2 className='text-3xl font-bold text-white mb-2'>
                          🎮 {t('info.guide.title', 'How to play CrazyCube')}
                        </h2>
                        <p className='text-violet-300 text-lg'>
                          {t(
                            'info.guide.subtitle',
                            'Complete guide to game mechanics'
                          )}
                        </p>
                      </div>
                    </Card>

                    {/* Unique Features */}
                    <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 mobile-safe-button'>
                      <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
                        <Zap className='h-6 w-6 mr-2 text-yellow-400' />
                        {t('info.features.title', 'Unique game features')}
                      </h3>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className='p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-slate-600/30 mobile-safe-button'
                        >
                          <div className='flex items-center mb-3'>
                            <Coins className='h-6 w-6 text-amber-400' />
                            <h4 className='text-lg font-bold text-white ml-3'>
                              {t(
                                'info.features.accumulate.title',
                                "Accumulated coins don't burn"
                              )}
                            </h4>
                          </div>
                          <p className='text-slate-300 text-sm'>
                            {t(
                              'info.features.accumulate.desc',
                              'Your CRAA tokens are locked and accumulate, they are not permanently burned!'
                            )}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className='p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-slate-600/30 mobile-safe-button'
                        >
                          <div className='flex items-center mb-3'>
                            <Activity className='h-6 w-6 text-blue-400' />
                            <h4 className='text-lg font-bold text-white ml-3'>
                              {t(
                                'info.features.future.title',
                                'Decentralized future'
                              )}
                            </h4>
                          </div>
                          <p className='text-slate-300 text-sm'>
                            {t(
                              'info.features.future.desc',
                              'After debugging (1-2 months) the team will disable admin rights and hand control to an autonomous agent'
                            )}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className='p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-slate-600/30 mobile-safe-button'
                        >
                          <div className='flex items-center mb-3'>
                            <TrendingUp className='h-6 w-6 text-green-400' />
                            <h4 className='text-lg font-bold text-white ml-3'>
                              {t(
                                'info.features.autonomy.title',
                                'Full autonomy'
                              )}
                            </h4>
                          </div>
                          <p className='text-slate-300 text-sm'>
                            {t(
                              'info.features.autonomy.desc',
                              'The NFT collection will move to fully decentralized market governance'
                            )}
                          </p>
                        </motion.div>
                      </div>
                    </Card>

                    {/* Game Actions */}
                    <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 mobile-safe-button'>
                      <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
                        <BarChart3 className='h-6 w-6 mr-2 text-cyan-400' />
                        {t('info.actions.title', 'Game actions & timers')}
                      </h3>

                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {[
                          {
                            icon: <Flame className='h-8 w-8 text-red-400' />,
                            title: t('info.actions.burn.title', 'Burn NFT'),
                            time: t('info.actions.burn.time', '12/24/48 hours'),
                            description: t(
                              'info.actions.burn.desc',
                              'Burn NFT and lock CRAA tokens to earn rewards'
                            ),
                            color: 'border-red-500/30 bg-red-900/10',
                          },
                          {
                            icon: (
                              <PieChart className='h-8 w-8 text-purple-400' />
                            ),
                            title: t(
                              'info.actions.graveyard.title',
                              'Graveyard'
                            ),
                            description: t(
                              'info.actions.graveyard.desc',
                              'Burned NFTs land in graveyard with 48h cooldown'
                            ),
                            time: t('info.actions.cooldown48', '48h cooldown'),
                            color: 'border-purple-500/30 bg-purple-900/10',
                          },
                          {
                            icon: (
                              <Activity className='h-8 w-8 text-pink-400' />
                            ),
                            title: t('info.actions.breed.title', 'Breeding'),
                            description: t(
                              'info.actions.breed.desc',
                              'Create new NFTs from the graveyard'
                            ),
                            time: t('info.actions.cooldown48', '48h cooldown'),
                            color: 'border-pink-500/30 bg-pink-900/10',
                            note: t(
                              'info.actions.breed.note',
                              'After breeding NFT cannot participate in actions'
                            ),
                          },
                          {
                            icon: <Zap className='h-8 w-8 text-yellow-400' />,
                            title: t('info.actions.ping.title', 'Ping'),
                            description: t(
                              'info.actions.ping.desc',
                              'Activate NFT to receive rewards'
                            ),
                            time: t('info.actions.ping.time', '7-day interval'),
                            color: 'border-yellow-500/30 bg-yellow-900/10',
                            note: t(
                              'info.actions.ping.note',
                              "NFT accumulate and don't burn!"
                            ),
                          },
                          {
                            icon: <Coins className='h-8 w-8 text-green-400' />,
                            title: t(
                              'info.actions.rewards.title',
                              'Pool rewards'
                            ),
                            description: t(
                              'info.actions.rewards.desc',
                              'Claim CRAA tokens from reward pool'
                            ),
                            time: t(
                              'info.actions.rewards.time',
                              '30-day interval'
                            ),
                            color: 'border-green-500/30 bg-green-900/10',
                          },
                          {
                            icon: (
                              <BarChart3 className='h-8 w-8 text-blue-400' />
                            ),
                            title: t(
                              'info.actions.other.title',
                              'Other actions'
                            ),
                            description: t(
                              'info.actions.other.desc',
                              'Various game mechanics'
                            ),
                            time: t('info.actions.other.time', '24h cooldown'),
                            color: 'border-blue-500/30 bg-blue-900/10',
                          },
                        ].map((action, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-5 rounded-xl ${action.color} border-2 hover:scale-105 transition-transform duration-300`}
                          >
                            <div className='flex items-center mb-3'>
                              {action.icon}
                              <h4 className='text-lg font-bold text-white ml-3'>
                                {action.title}
                              </h4>
                            </div>

                            <div className='space-y-2'>
                              <div className='flex items-center justify-between'>
                                <span className='text-slate-400 text-sm'>
                                  {t('info.actions.timeLabel', 'Time:')}
                                </span>
                                <div className='text-xs border border-slate-600 px-2 py-1 rounded text-slate-300 mobile-safe-button'>
                                  {action.time}
                                </div>
                              </div>

                              <p className='text-slate-300 text-sm'>
                                {action.description}
                              </p>

                              {action.note && (
                                <div className='mt-3 p-2 bg-yellow-900/20 rounded border border-yellow-500/30 mobile-safe-button'>
                                  <p className='text-yellow-300 text-xs'>
                                    ⚠️ {action.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </Card>

                    {/* Decentralization Roadmap */}
                    <Card className='p-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30 mobile-safe-button'>
                      <h3 className='text-2xl font-bold text-white mb-6 flex items-center'>
                        <Info className='h-6 w-6 mr-2 text-indigo-400' />
                        {t('info.roadmap.title', 'Road to decentralization')}
                      </h3>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='text-center'>
                          <div className='bg-yellow-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                            <span className='text-2xl'>⚙️</span>
                          </div>
                          <h4 className='text-lg font-bold text-white mb-2'>
                            {t(
                              'info.roadmap.phase1.title',
                              'Phase 1: Debugging'
                            )}
                          </h4>
                          <p className='text-slate-300 text-sm'>
                            {t(
                              'info.roadmap.phase1.desc',
                              '1-2 months of testing and optimizing all game mechanics'
                            )}
                          </p>
                        </div>

                        <div className='text-center'>
                          <div className='bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                            <span className='text-2xl'>🤖</span>
                          </div>
                          <h4 className='text-lg font-bold text-white mb-2'>
                            {t(
                              'info.roadmap.phase2.title',
                              'Phase 2: Autonomy'
                            )}
                          </h4>
                          <p className='text-slate-300 text-sm'>
                            {t(
                              'info.roadmap.phase2.desc',
                              'Connect autonomous agent and remove admin rights'
                            )}
                          </p>
                        </div>

                        <div className='text-center'>
                          <div className='bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                            <span className='text-2xl'>🌐</span>
                          </div>
                          <h4 className='text-lg font-bold text-white mb-2'>
                            {t('info.roadmap.phase3.title', 'Phase 3: Freedom')}
                          </h4>
                          <p className='text-slate-300 text-sm'>
                            {t(
                              'info.roadmap.phase3.desc',
                              'Full transfer of control to community'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className='mt-6 p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/30 mobile-safe-button'>
                        <p className='text-indigo-300 text-center font-semibold'>
                          {t(
                            'info.roadmap.callout',
                            '🚀 CrazyCube is the first NFT collection with a full decentralization plan!'
                          )}
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Overview Tab - more compact */}
              <TabsContent value='overview'>
                <div className='grid grid-cols-1 gap-4'>
                  <StatsGrid />
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <BurnReviveChart />
                    <TokenAllocationDonut />
                    <RewardsChart />
                  </div>
                  {/* Fallback message if charts don't load */}
                  <div className='text-center text-slate-400 text-sm mt-4'>
                    {t(
                      'info.overview.fallback',
                      'Charts may take a moment to load...'
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* CRAA Token Tab */}
              <TabsContent value='cra-token'>
                <div className='grid grid-cols-1 gap-6'>
                  <CRATokenInfo />
                  {/* Fallback message */}
                  <div className='text-center text-slate-400 text-sm mt-4'>
                    {t(
                      'info.craa.fallback',
                      'Token data may take a moment to load...'
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Contract Stats Tab */}
              <TabsContent value='contract-stats'>
                <div className='grid grid-cols-1 gap-6'>
                  <ContractFullStats />
                </div>
              </TabsContent>

              {/* Live Data Tab */}
              <TabsContent value='subgraph'>
                <div className='grid grid-cols-1 gap-6'>
                  <Denis3LiveData />
                </div>
              </TabsContent>

              {/* Live Analytics Tab */}
              <TabsContent value='denis3'>
                <Denis3Analytics />
                <div className='mt-8'>
                  <CRABurnAnalytics />
                </div>
                <div className='mt-8'>
                  <PlayerAnalytics />
                </div>
              </TabsContent>

              {/* System Tab */}
              <TabsContent value='system'>
                <div className='max-w-lg mx-auto flex flex-col gap-6 items-center'>
                  <PerformanceInfo />
                  {!isMobile && (
                    <div className='w-full'>
                      {/* Performance mode toggle removed - always show full effects */}
                      <div className='mt-4'>
                        {/* Component loaded dynamically */}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
