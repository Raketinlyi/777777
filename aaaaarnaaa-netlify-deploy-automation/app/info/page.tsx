'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { ComponentType, SVGProps, PointerEvent as ReactPointerEvent } from 'react';

import { Card, CardContent } from '@/components/ui/card';
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
import { monadChain } from '@/config/chains';
import { useMobile } from '@/hooks/use-mobile';
import { ContractInfo } from '@/components/web3/contract-info';
import MarketTicker from '@/components/MarketTicker';
import { motion } from 'framer-motion';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { cn } from '@/lib/utils';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
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
const OCTATokenInfo = dynamic(() => import('@/components/OCTATokenInfo'), {
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

interface InfoMetricProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  hint: string;
}

function InfoMetric({ icon: Icon, label, value, hint }: InfoMetricProps) {
  return (
    <Card className='border-violet-500/20 bg-black/40 text-slate-100 shadow-[0_0_30px_rgba(129,140,248,0.12)]'>
      <CardContent className='flex items-start gap-2 p-3'>
        <div className='rounded-full bg-violet-500/20 p-1.5 text-violet-200'>
          <Icon className='h-4 w-4' />
        </div>
        <div className='space-y-0.5'>
          <div className='text-[10px] uppercase tracking-wide text-slate-400'>{label}</div>
          <div className='text-sm font-semibold text-white'>{value}</div>
          <div className='text-[9px] text-slate-400'>{hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InfoPage() {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const { /* isLiteMode */ } = usePerformanceContext();
  const [selectedTab, setSelectedTab] = useState('nft-inspector');
  const {
    graveyardSize,
    pingInterval,
    breedCost,
    breedOctaCost,
    breedSponsorFee,
    breedLpContribution,
    burnFeeBps,
  } = useCrazyOctagonGame();

  const pingMinutes = Math.max(1, Math.round(pingInterval / 60));

  // Network context (Monad) for dynamic copy
  const chainName = monadChain.name;
  const pairTokenSymbol = monadChain.nativeCurrency.symbol;

  // Watermark временно отключён: все вкладки получают собственный контент
  const showWatermark = false;

  const heroRef = useRef<HTMLDivElement | null>(null);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const enableHeroTilt = !isMobile;

  const handleHeroPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enableHeroTilt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 10;
    setHeroTilt({ x: rotateX, y: rotateY });
  };

  const tabDefinitions = useMemo(
    () => [
      { value: 'nft-inspector', label: t('info.nftInspector', 'NFT Inspector'), icon: Database, accent: 'pink' },
      { value: 'overview', label: t('info.tabs.overview', 'Overview'), icon: BarChart3, accent: 'violet' },
      { value: 'cra-token', label: t('info.tabs.octaaToken', 'OCTA Token'), icon: Coins, accent: 'orange' },
      { value: 'contract-stats', label: t('info.tabs.contract', 'Contract Stats'), icon: Database, accent: 'emerald' },
      { value: 'subgraph', label: t('info.tabs.contractData', 'Live Data'), icon: Info, accent: 'blue' },
      { value: 'denis3', label: t('info.tabs.liveAnalytics', 'Live Analytics'), icon: Zap, accent: 'cyan' },
      { value: 'system', label: t('info.tabs.system', 'System'), icon: Activity, accent: 'slate' },
    ],
    [t]
  );

  const accentGradients: Record<string, string> = {
    blue: 'from-blue-500/80 to-cyan-400/80',
    violet: 'from-violet-500/80 to-fuchsia-500/80',
    orange: 'from-orange-500/80 to-amber-400/80',
    emerald: 'from-emerald-500/80 to-teal-400/80',
    pink: 'from-pink-500/80 to-rose-500/80',
    cyan: 'from-cyan-500/80 to-sky-400/80',
    slate: 'from-slate-500/70 to-slate-300/70',
  };

  const activeTabDefinition = tabDefinitions.find(tab => tab.value === selectedTab) ?? tabDefinitions[0];
  const activeGradient = accentGradients[activeTabDefinition?.accent ?? 'violet'] ?? accentGradients.violet;

  const tabsListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const update = () => {
      const listEl = tabsListRef.current;
      const activeEl = tabRefs.current[selectedTab];
      if (listEl && activeEl) {
        const listRect = listEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          width: activeRect.width,
          left: activeRect.left - listRect.left,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [selectedTab, tabDefinitions, isMobile]);

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

        <motion.section
          ref={heroRef}
          className='relative mt-6 overflow-hidden rounded-2xl border border-violet-500/25 bg-slate-950/75 shadow-[0_20px_60px_rgba(129,140,248,0.18)]'
          style={{ transformStyle: 'preserve-3d' }}
          onPointerMove={enableHeroTilt ? handleHeroPointer : undefined}
          onPointerLeave={enableHeroTilt ? () => setHeroTilt({ x: 0, y: 0 }) : undefined}
          animate={{ rotateX: enableHeroTilt ? heroTilt.x : 0, rotateY: enableHeroTilt ? heroTilt.y : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <div className='absolute inset-0 bg-gradient-to-br from-violet-500/15 via-transparent to-sky-500/10' />
          <div className='relative z-10 p-4 md:p-6'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='flex-1 text-center md:text-left'>
                <h1 className='text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-cyan-200 mb-2'>
                  {t('info.hero.title', 'Crazy Octagon Analytics')}
                </h1>
                <div className='flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-slate-300/90'>
                  <span className='rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-1'>
                    {chainName} • {pairTokenSymbol}
                  </span>
                  <span className='rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1'>
                    {t('info.hero.status', 'Live data feed')}
                  </span>
                  <span className='text-slate-400'>
                    {t('info.hero.subtitle', 'Track burn economics and on-chain health.')}
                  </span>
                </div>
              </div>
              
              {!isMobile && (
                <motion.div
                  className='w-[120px] h-[120px] flex-shrink-0'
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  <div
                    className='absolute inset-0 rounded-full blur-2xl'
                    style={{ background: 'radial-gradient(rgba(129,140,248,0.25), transparent 65%)' }}
                  />
                  <NalaInfoCube />
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        <main>
          {/* NFT Inspector - moved to top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mt-6'
          >
            <NFTCooldownInspector />
          </motion.div>

          {/* Status Cards - moved below NFT Inspector */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className='mt-6 mb-6 grid gap-3 md:grid-cols-2'
          >
            {/* Combined Network & Status Card */}
            <Card className='border-violet-500/20 bg-black/40 text-slate-100 shadow-[0_0_30px_rgba(129,140,248,0.12)]'>
              <CardContent className='p-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='rounded-full bg-violet-500/20 p-1.5 text-violet-200'>
                      <Database className='h-4 w-4' />
                    </div>
                    <div>
                      <div className='text-[10px] uppercase tracking-wide text-slate-400'>Network & Status</div>
                      <div className='text-sm font-semibold text-white'>{chainName} • {pairTokenSymbol}</div>
                      <div className='text-[9px] text-slate-400'>Live data feed active</div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-[10px] uppercase tracking-wide text-slate-400'>Graveyard</div>
                    <div className='text-sm font-semibold text-white'>{graveyardSize}</div>
                    <div className='text-[9px] text-slate-400'>NFTs ready</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Combined Costs & Fees Card */}
            <Card className='border-violet-500/20 bg-black/40 text-slate-100 shadow-[0_0_30px_rgba(129,140,248,0.12)]'>
              <CardContent className='p-3'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='rounded-full bg-violet-500/20 p-1.5 text-violet-200'>
                        <Coins className='h-4 w-4' />
                      </div>
                      <div>
                        <div className='text-[10px] uppercase tracking-wide text-slate-400'>Breed Cost</div>
                        <div className='text-sm font-semibold text-white'>{breedCost} / {breedOctaCost} OCTA</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-[10px] uppercase tracking-wide text-slate-400'>Ping</div>
                      <div className='text-sm font-semibold text-white'>{pingMinutes} min</div>
                    </div>
                  </div>
                  <div className='text-[9px] text-slate-400 border-t border-slate-700 pt-1'>
                    Burn fee: {(burnFeeBps / 100).toFixed(1)}% • Sponsor: {breedSponsorFee} OCTA
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Market Ticker - moved below status cards */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            className='mb-6'
          >
            <MarketTicker />
          </motion.div>

          {/* Main tabs - larger tabs */}
          <div className='mt-6'>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList
                ref={tabsListRef}
                className={cn(
                  'relative mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-2 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.35)]',
                  isMobile && 'justify-center'
                )}
              >
                {indicatorStyle.width > 0 && (
                  <motion.span
                    className={cn('absolute top-1 bottom-1 rounded-xl bg-gradient-to-r shadow-[0_8px_24px_rgba(99,102,241,0.35)]', activeGradient)}
                    animate={{ width: indicatorStyle.width, x: indicatorStyle.left }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  />
                )}
                {tabDefinitions.map(item => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      ref={el => {
                        tabRefs.current[item.value] = el;
                      }}
                      className={cn(
                        'relative z-10 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-0 data-[state=active]:text-white hover:text-slate-100',
                        isMobile && 'flex-1 justify-center min-w-[46%] text-xs'
                      )}
                    >
                      <Icon className='h-5 w-5' />
                      {!isMobile && <span>{item.label}</span>}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Contract Info Tab */}
              <TabsContent value='nft-inspector'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='grid grid-cols-1 gap-6'
                >
                  <ContractInfo />
                  <UserNftsList />

                  {/* Game Guide */}
                  <div className='space-y-8 mt-8'>
                    {/* Game Title */}
                    <Card className='p-6 bg-gradient-to-r from-violet-900/50 to-purple-900/50 border-violet-500/30 mobile-safe-button'>
                      <div className='text-center'>
                        <h2 className='text-3xl font-bold text-white mb-2'>
                          🎮 {t('info.guide.title', 'How to play Crazy Octagon')}
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
                              `Rewards accrue without permanent burn: OCTA is locked by pings, and on claim OCTA is burned while you receive ${pairTokenSymbol} on ${chainName}.`
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
                              `Burn NFT to lock OCTA and start accruing rewards; later you can claim ${pairTokenSymbol} on ${chainName}.`
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
                              `Claim your rewards in ${pairTokenSymbol} on ${chainName}; the OCTA part is burned at claim time.`
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
                            '🚀 Crazy Octagon is the first NFT collection with a full decentralization plan!'
                          )}
                        </p>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Overview Tab - more compact */}
              <TabsContent value='overview'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='grid grid-cols-1 gap-4'
                >
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
                </motion.div>
              </TabsContent>

              {/* OCTA Token Tab */}
              <TabsContent value='cra-token'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='grid grid-cols-1 gap-6'
                >
                  <OCTATokenInfo />
                  {/* Fallback message */}
                  <div className='text-center text-slate-400 text-sm mt-4'>
                    {t(
                      'info.octa.fallback',
                      'Token data may take a moment to load...'
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              {/* Contract Stats Tab */}
              <TabsContent value='contract-stats'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='grid grid-cols-1 gap-6'
                >
                  <ContractFullStats />
                </motion.div>
              </TabsContent>

              {/* Live Data Tab */}
              <TabsContent value='subgraph'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='grid grid-cols-1 gap-6'
                >
                  <Denis3LiveData />
                </motion.div>
              </TabsContent>

              {/* Live Analytics Tab */}
              <TabsContent value='denis3'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Denis3Analytics />
                  <div className='mt-8'>
                    <CRABurnAnalytics />
                  </div>
                  <div className='mt-8'>
                    <PlayerAnalytics />
                  </div>
                </motion.div>
              </TabsContent>

              {/* System Tab */}
              <TabsContent value='system'>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='max-w-lg mx-auto flex flex-col gap-6 items-center'
                >
                  <PerformanceInfo />
                  {!isMobile && (
                    <div className='w-full'>
                      <div className='mt-4 text-center text-xs text-slate-500'>
                        {t('info.system.note', 'Full visual mode enabled')}
                      </div>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
