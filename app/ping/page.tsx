'use client';

import React from 'react';
import { ArrowLeft, SatelliteDish } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { ParticleEffect } from '@/components/particle-effect';
import dynamic from 'next/dynamic';
const CoinsAnimation = dynamic(
  () => import('@/components/coins-animation').then(m => m.CoinsAnimation),
  { ssr: false }
);
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import NFTPingCard from '@/components/NFTPingCard';

import { motion } from 'framer-motion';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { TabNavigation } from '@/components/tab-navigation';
import { LazyLoad } from '@/components/LazyLoad';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocialPrompt } from '@/hooks/use-social-prompt';
import { SocialPromptModal } from '@/components/SocialPromptModal';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import {
  PANCAKESWAP_CRAA_LP_URL,
  PANCAKESWAP_OCTAA_SWAP_URL,
  DEXSCREENER_CRAA_URL,
} from '@/lib/token-links';

export default function PingPage() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { data: nfts = [], isLoading: isLoadingNFTs, refetch } = useAlchemyNftsQuery();
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const { isMobile } = useMobile();

  // Add magical animations CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-0 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        25% { transform: translateY(-20px) translateX(10px); }
        50% { transform: translateY(-10px) translateX(-5px); }
        75% { transform: translateY(-25px) translateX(8px); }
      }
      @keyframes float-1 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        33% { transform: translateY(-15px) translateX(-8px); }
        66% { transform: translateY(-30px) translateX(12px); }
      }
      @keyframes float-2 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        20% { transform: translateY(-25px) translateX(15px); }
        40% { transform: translateY(-5px) translateX(-10px); }
        60% { transform: translateY(-20px) translateX(5px); }
        80% { transform: translateY(-15px) translateX(-12px); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(100vw); }
        100% { transform: translateX(100vw); }
      }
      @keyframes shimmer-vertical {
        0% { transform: translateY(100%); }
        50% { transform: translateY(-100vh); }
        100% { transform: translateY(-100vh); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // const { isLiteMode } = usePerformanceContext(); // not used here

  // track ping success
  const [pingedNow, setPingedNow] = useState(false);
  const { show, close } = useSocialPrompt(address, pingedNow);

  const handlePingSuccessWrapper = () => {
    setPingedNow(true);
    // reset flag after evaluation to avoid repeated opens until next ping
    setTimeout(() => setPingedNow(false), 100);
  };

  // Auto-show guide logic
  useEffect(() => {
    if (!isConnected || !address) return;

    const GUIDE_STORAGE_KEY = `crazycube_guide_shown_${address}`;
    const lastShown = localStorage.getItem(GUIDE_STORAGE_KEY);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Show if never shown or 7+ days passed
    if (!lastShown || now - parseInt(lastShown) > sevenDaysMs) {
      setShowGuide(true);
      localStorage.setItem(GUIDE_STORAGE_KEY, now.toString());
    }
  }, [isConnected, address]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load persisted tooltip preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crazycube_tooltips_enabled');
      if (saved !== null) setTooltipsEnabled(saved === '1');
    } catch {}
  }, []);

  const toggleTooltips = (val: boolean) => {
    setTooltipsEnabled(val);
    try { localStorage.setItem('crazycube_tooltips_enabled', val ? '1' : '0'); } catch {}
  };

  const handleConnect = () => {
    const injected = connectors.find(c => c.type === 'injected');
    if (injected) connect({ connector: injected });
  };

  // Function to render structured game guide content
  const renderGameGuideContent = () => {
    const quickLinks = (
      <div className='mt-4 space-y-2 text-sm text-violet-200'>
        <div className='font-semibold text-violet-300'>
          {t('wallet.pancakeLinks.title', 'Quick DeFi links')}
        </div>
        <ul className='space-y-1'>
          <li>
            <a
              href={PANCAKESWAP_OCTAA_SWAP_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-cyan-300 hover:text-cyan-200 underline'
            >
                🟡 {t('wallet.pancakeLinks.octaa', 'Swap OCTAA on PancakeSwap')}
            </a>
          </li>
          <li>
            <a
              href={PANCAKESWAP_CRAA_LP_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-amber-300 hover:text-amber-200 underline'
            >
              🟠 {t('wallet.pancakeLinks.craa', 'Swap CRAA on PancakeSwap')}
            </a>
          </li>
          <li>
            <a
              href={DEXSCREENER_CRAA_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-purple-300 hover:text-purple-100 underline'
            >
              📊 {t('wallet.pancakeLinks.dex', 'View CRAA chart (DexScreener)')}
            </a>
          </li>
        </ul>
      </div>
    );

    try {
      const content = t('wallet.gameGuideContent');
      
      // If content is a string (fallback), return it as is
      if (typeof content === 'string') {
        return (
          <div className='text-slate-300 whitespace-pre-line text-sm leading-relaxed space-y-4'>
            <div>{content}</div>
            {quickLinks}
          </div>
        );
      }
      
      // If content is an object, render it structured
      if (typeof content === 'object' && content !== null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guideContent = content as any;
        
        return (
          <div className='text-slate-300 text-sm leading-relaxed space-y-6'>
            {/* Title */}
            <div className='text-lg font-bold text-violet-300 mb-4'>
              {guideContent?.title || '🎮 CrazyCube Game Guide'}
            </div>
            
            {/* Getting Started */}
            {guideContent?.gettingStarted && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.gettingStarted?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.gettingStarted?.getCRAA}</div>
                  <div>{guideContent.gettingStarted?.buyNFTs}</div>
                </div>
              </div>
            )}
            
            {/* How to Start */}
            {guideContent?.howToStart && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.howToStart?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToStart?.goToPing}</div>
                  <div>{guideContent.howToStart?.activate}</div>
                  <div>{guideContent.howToStart?.pingAfterActivation}</div>
                  <div>{guideContent.howToStart?.pingRewards}</div>
                  <div className='ml-4'>
                    <div>{guideContent.howToStart?.rarityFactor}</div>
                    <div>{guideContent.howToStart?.experienceBonus}</div>
                    <div>{guideContent.howToStart?.timeFactor}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Experience Bonus */}
            {guideContent?.experienceBonus && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.experienceBonus?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.experienceBonus?.initialPenalty}</div>
                  <div>{guideContent.experienceBonus?.bonusGrowth}</div>
                  <div>{guideContent.experienceBonus?.maxBonus}</div>
                  <div>{guideContent.experienceBonus?.miss10Days}</div>
                  <div>{guideContent.experienceBonus?.miss20Days}</div>
                </div>
              </div>
            )}
            
            {/* How to Get OCTAA */}
            {guideContent?.howToGetCRAA && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.howToGetCRAA?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToGetCRAA?.accumulation}</div>
                  <div>{guideContent.howToGetCRAA?.collect}</div>
                </div>
              </div>
            )}
            
            {/* How to Burn */}
            {guideContent?.howToBurn && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.howToBurn?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToBurn?.goToBurn}</div>
                  <div>{guideContent.howToBurn?.chooseCube}</div>
                  <div className='ml-4'>
                    <div>{guideContent.howToBurn?.time12h}</div>
                    <div>{guideContent.howToBurn?.time24h}</div>
                    <div>{guideContent.howToBurn?.time48h}</div>
                  </div>
                  <div>{guideContent.howToBurn?.restSplit}</div>
                  <div>{guideContent.howToBurn?.claim}</div>
                </div>
              </div>
            )}
            
            {/* How to Revive */}
            {guideContent?.howToRevive && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.howToRevive?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToRevive?.goToBreed}</div>
                  <div>{guideContent.howToRevive?.choose2Cubes}</div>
                  <div>{guideContent.howToRevive?.payCRAA}</div>
                  <div>{guideContent.howToRevive?.randomNFT}</div>
                  <div className='ml-4'>
                    <div>{guideContent.howToRevive?.bonusReset}</div>
                    <div>{guideContent.howToRevive?.starsRestored}</div>
                    <div>{guideContent.howToRevive?.canPingAgain}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* OCTAA in System */}
            {guideContent?.crasInSystem && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.crasInSystem?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.crasInSystem?.pingRewards}</div>
                  <div>{guideContent.crasInSystem?.breedReturns}</div>
                  <div>{guideContent.crasInSystem?.burnForever}</div>
                  <div>{guideContent.crasInSystem?.burnedGoesTo}</div>
                </div>
              </div>
            )}
            
            {/* OCTAA Fees */}
            {guideContent?.crasFees && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.crasFees?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.crasFees?.transferFee}</div>
                  <div>{guideContent.crasFees?.dexSalesFee}</div>
                  <div>{guideContent.crasFees?.dexPurchaseFee}</div>
                  <div>{guideContent.crasFees?.feesSupport}</div>
                </div>
              </div>
            )}
            
            {/* Example Strategy */}
            {guideContent?.exampleStrategy && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.exampleStrategy?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.exampleStrategy?.youHaveThree}</div>
                  <div>{guideContent.exampleStrategy?.common}</div>
                  <div>{guideContent.exampleStrategy?.rare}</div>
                  <div>{guideContent.exampleStrategy?.mystic}</div>
                  <div className='font-semibold text-violet-300 mt-2'>{guideContent.exampleStrategy?.playCalmly}</div>
                  <div className='ml-4'>
                    <div>{guideContent.exampleStrategy?.pingEvery10Days}</div>
                    <div>{guideContent.exampleStrategy?.burnWeakCubes}</div>
                    <div>{guideContent.exampleStrategy?.reviveDead}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tips */}
            {guideContent?.tips && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.tips?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.tips?.maxProfit}</div>
                  <div>{guideContent.tips?.burnedTokens}</div>
                </div>
              </div>
            )}
            
            {/* Vision */}
            {guideContent?.vision && (
              <div className='space-y-2'>
                <div className='font-semibold text-violet-300'>{guideContent.vision?.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.vision?.plans}</div>
                  <div>{guideContent.vision?.noBonuses}</div>
                  <div>{guideContent.vision?.decentralized}</div>
                </div>
              </div>
            )}
            {quickLinks}
          </div>
        );
      }
      
      // Fallback
      return <div className='text-slate-300'>Game guide content not available</div>;
  } catch {
      return <div className='text-slate-300'>Error loading game guide</div>;
    }
  };

  if (!mounted)
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#6D28D9] via-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white'>
        {t('common.loading', 'Loading...')}
      </div>
    );

  return (
    <div
      className='min-h-screen mobile-content-wrapper relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4'
    >
      {/* Full screen gradient background with more depth */}
      <div className='fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900' />
      
      {/* Additional atmospheric layers */}
      <div className='fixed inset-0 -z-5 bg-gradient-to-t from-transparent via-purple-800/10 to-transparent' />
      <div className='fixed inset-0 -z-5 bg-gradient-to-r from-transparent via-indigo-800/10 to-transparent' />
      
      {/* Cosmic rain of golden cubes - always show */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <CoinsAnimation intensity={isMobile ? 0.45 : 0.75} theme='gold' />
        <ParticleEffect
          count={isMobile ? 5 : 12}
          colors={['#A78BFA', '#60A5FA', '#34D399', '#FBBF24']}
          speed={isMobile ? 0.12 : 0.24}
          size={isMobile ? 2 : 3}
        />
      </div>
      
      {/* Magical floating orbs */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='absolute w-16 h-16 rounded-full opacity-12'
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i % 3) * 25}%`,
              background: `radial-gradient(circle, ${
                ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F472B6'][i % 5]
              }, transparent)`,
              filter: 'blur(10px)',
              animation: `float-${i % 3} ${12 + i * 1.5}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Aurora-like flowing gradients - removed spinning */}
      <div className='fixed inset-0 pointer-events-none z-0 overflow-hidden'>
        <div 
          className='absolute w-full h-full opacity-30'
          style={{
            background: 'conic-gradient(from 0deg at 20% 30%, transparent, #60A5FA44, transparent, #A78BFA44, transparent)',
          }}
        />
        <div 
          className='absolute w-full h-full opacity-25'
          style={{
            background: 'conic-gradient(from 180deg at 80% 70%, transparent, #34D39944, transparent, #FBBF2444, transparent)',
          }}
        />
      </div>
      
      {/* Shimmer waves */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <div 
          className='absolute top-0 left-0 w-full h-2 opacity-20'
          style={{
            background: 'linear-gradient(90deg, transparent, #ffffff88, transparent)',
            animation: 'shimmer 8s ease-in-out infinite',
          }}
        />
        <div 
          className='absolute bottom-0 right-0 w-2 h-full opacity-18'
          style={{
            background: 'linear-gradient(0deg, transparent, #60A5FA66, transparent)',
            animation: 'shimmer-vertical 12s ease-in-out infinite',
          }}
        />
      </div>
      
      <div className='container mx-auto relative z-10'>
        <header className='mb-2 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-slate-400/50 bg-slate-800/60 text-slate-100 hover:bg-slate-700/70 mobile-safe-button backdrop-blur-sm'
            >
              <ArrowLeft className='mr-2 w-4 h-4' />{' '}
              {t('navigation.home', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          <WalletConnect />
        </header>

        {/* Page Title, Info and Compact Tooltips Toggle (single row) */}
        <div className='flex items-center justify-between gap-3 mb-1'>
          <p className='text-slate-100 text-xs md:text-sm font-semibold leading-relaxed drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis'>
            {t('ping.pageTitle', 'Ping every 7 days to earn OCTAA • Keep a streak for bonus')}
          </p>
          <div className='flex items-center gap-2 text-slate-200/80 whitespace-nowrap'>
            <span className='text-[12px]'>{t('ping.tooltips', 'Tooltips')}</span>
            <Switch className='scale-90' checked={tooltipsEnabled} onCheckedChange={toggleTooltips} />
            <span className='text-[11px]'>{tooltipsEnabled ? t('ping.tooltipsOn', 'On') : t('ping.tooltipsOff', 'Off')}</span>
          </div>
        </div>

        {!isConnected ? (
          <div className='text-center py-12'>
            <SatelliteDish className='w-12 h-12 text-slate-300 mx-auto mb-4 drop-shadow-lg' />
            <p className='text-white mb-4 drop-shadow-sm'>
              {t('ping.connectWallet', 'Connect wallet to view your cubes')}
            </p>
            <Button
              onClick={handleConnect}
              className='bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-900 font-semibold shadow-[0_0_18px_rgba(251,191,36,0.35)] hover:from-amber-400 hover:to-yellow-400'
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {t('wallet.connect', 'Connect Wallet')}
              </motion.span>
            </Button>
          </div>
        ) : isLoadingNFTs ? (
          <div className='text-center text-white drop-shadow-sm'>
            {t('common.loadingNFTs', 'Loading NFTs...')}
          </div>
        ) : nfts.length === 0 ? (
          <div className='text-center text-white drop-shadow-sm'>
            {t('ping.noNFTs', 'No CrazyCube NFTs found.')}
          </div>
        ) : (
          <div className='relative'>
            {/* Compact tooltips toggle moved under page title */}
            {/* Magical energy field around NFT grid */}
            <div className='absolute inset-0 pointer-events-none z-0'>
              <div 
                className='absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-20'
                style={{
                  background: 'radial-gradient(circle, #60A5FA22, #A78BFA22, transparent)',
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(40px)',
                  animation: 'pulse 4s ease-in-out infinite',
                }}
              />
              <div 
                className='absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-15'
                style={{
                  background: 'radial-gradient(circle, #34D39933, transparent)',
                  filter: 'blur(30px)',
                  animation: 'pulse 6s ease-in-out infinite reverse',
                }}
              />
            </div>
            
            <LazyLoad
              placeholder={<Skeleton className='h-64 w-full bg-slate-700/30' />}
            >
              <section className='relative z-10 rounded-2xl border border-slate-700/30 bg-slate-900/40 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/5 p-3 md:p-4'>
                <div className='nft-card-grid'>
        {nfts.map((nft, idx) => (
                  <NFTPingCard
                    key={idx}
                    nft={nft}
                    index={idx}
          tooltipsEnabled={tooltipsEnabled}
                    onActionComplete={() => {
                      refetch();
                      handlePingSuccessWrapper();
                    }}
                  />
                ))}
                </div>
              </section>
            </LazyLoad>
          </div>
        )}
      </div>

      {/* Auto-show Game Guide Modal */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className='max-w-2xl max-h-[80vh] bg-slate-800/95 border-slate-600/50 backdrop-blur-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold text-white flex items-center drop-shadow-sm'>
              <BookOpen className='w-5 h-5 mr-2 text-amber-400' />
              {t('wallet.gameGuide', 'CrazyCube Game Guide')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className='h-[60vh] pr-4'>
            {renderGameGuideContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {show && (
        <SocialPromptModal
          tweetId={
            process.env.NEXT_PUBLIC_PROMO_TWEET_ID || '1937267010896818686'
          }
          onClose={close}
        />
      )}
    </div>
  );
}
