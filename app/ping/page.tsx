'use client';

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
import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import NFTPingCard from '@/components/NFTPingCard';

import { motion } from 'framer-motion';
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';
import { TabNavigation } from '@/components/tab-navigation';
import { LazyLoad } from '@/components/LazyLoad';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocialPrompt } from '@/hooks/use-social-prompt';
import { SocialPromptModal } from '@/components/SocialPromptModal';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { useTranslation } from 'react-i18next';

export default function PingPage() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { nfts, isLoading: isLoadingNFTs, refetch } = useAlchemyNfts();
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { isMobile } = useMobile();

  const { isLiteMode } = usePerformanceContext();

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

  const handleConnect = () => {
    const injected = connectors.find(c => c.type === 'injected');
    if (injected) connect({ connector: injected });
  };

  // Function to render structured game guide content
  const renderGameGuideContent = () => {
    try {
      const content = t('wallet.gameGuideContent');
      
      // If content is a string (fallback), return it as is
      if (typeof content === 'string') {
        return <div className='text-slate-300 whitespace-pre-line text-sm leading-relaxed'>{content}</div>;
      }
      
      // If content is an object, render it structured
      if (typeof content === 'object' && content !== null) {
        const guideContent = content as any; // Type assertion for the structured content
        
        return (
          <div className='text-slate-300 text-sm leading-relaxed space-y-6'>
            {/* Title */}
            <div className='text-lg font-bold text-cyan-400 mb-4'>
              {guideContent.title || '🎮 CrazyCube Game Guide'}
            </div>
            
            {/* Getting Started */}
            {guideContent.gettingStarted && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.gettingStarted.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.gettingStarted.getCRAA}</div>
                  <div>{guideContent.gettingStarted.buyNFTs}</div>
                </div>
              </div>
            )}
            
            {/* How to Start */}
            {guideContent.howToStart && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.howToStart.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToStart.goToPing}</div>
                  <div>{guideContent.howToStart.activate}</div>
                  <div>{guideContent.howToStart.pingAfterActivation}</div>
                  <div>{guideContent.howToStart.pingRewards}</div>
                  <div className='ml-4'>
                    <div>{guideContent.howToStart.rarityFactor}</div>
                    <div>{guideContent.howToStart.experienceBonus}</div>
                    <div>{guideContent.howToStart.timeFactor}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Experience Bonus */}
            {guideContent.experienceBonus && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.experienceBonus.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.experienceBonus.initialPenalty}</div>
                  <div>{guideContent.experienceBonus.bonusGrowth}</div>
                  <div>{guideContent.experienceBonus.maxBonus}</div>
                  <div>{guideContent.experienceBonus.miss10Days}</div>
                  <div>{guideContent.experienceBonus.miss20Days}</div>
                </div>
              </div>
            )}
            
            {/* How to Get CRAA */}
            {guideContent.howToGetCRAA && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.howToGetCRAA.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToGetCRAA.accumulation}</div>
                  <div>{guideContent.howToGetCRAA.collect}</div>
                </div>
              </div>
            )}
            
            {/* How to Burn */}
            {guideContent.howToBurn && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.howToBurn.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToBurn.goToBurn}</div>
                  <div>{guideContent.howToBurn.chooseCube}</div>
                  <div className='ml-4'>
                    <div>{guideContent.howToBurn.time12h}</div>
                    <div>{guideContent.howToBurn.time24h}</div>
                    <div>{guideContent.howToBurn.time48h}</div>
                  </div>
                  <div>{guideContent.howToBurn.restSplit}</div>
                  <div>{guideContent.howToBurn.claim}</div>
                </div>
              </div>
            )}
            
            {/* How to Revive */}
            {guideContent.howToRevive && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.howToRevive.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToRevive.goToBreed}</div>
                  <div>{guideContent.howToRevive.choose2Cubes}</div>
                  <div>{guideContent.howToRevive.payCRAA}</div>
                  <div>{guideContent.howToRevive.randomNFT}</div>
                  <div className='ml-4'>
                    <div>{guideContent.howToRevive.bonusReset}</div>
                    <div>{guideContent.howToRevive.starsRestored}</div>
                    <div>{guideContent.howToRevive.canPingAgain}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* CRAA in System */}
            {guideContent.crasInSystem && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.crasInSystem.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.crasInSystem.pingRewards}</div>
                  <div>{guideContent.crasInSystem.breedReturns}</div>
                  <div>{guideContent.crasInSystem.burnForever}</div>
                  <div>{guideContent.crasInSystem.burnedGoesTo}</div>
                </div>
              </div>
            )}
            
            {/* CRAA Fees */}
            {guideContent.crasFees && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.crasFees.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.crasFees.transferFee}</div>
                  <div>{guideContent.crasFees.dexSalesFee}</div>
                  <div>{guideContent.crasFees.dexPurchaseFee}</div>
                  <div>{guideContent.crasFees.feesSupport}</div>
                </div>
              </div>
            )}
            
            {/* Example Strategy */}
            {guideContent.exampleStrategy && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.exampleStrategy.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.exampleStrategy.youHaveThree}</div>
                  <div>{guideContent.exampleStrategy.common}</div>
                  <div>{guideContent.exampleStrategy.rare}</div>
                  <div>{guideContent.exampleStrategy.mystic}</div>
                  <div className='font-semibold text-cyan-300 mt-2'>{guideContent.exampleStrategy.playCalmly}</div>
                  <div className='ml-4'>
                    <div>{guideContent.exampleStrategy.pingEvery10Days}</div>
                    <div>{guideContent.exampleStrategy.burnWeakCubes}</div>
                    <div>{guideContent.exampleStrategy.reviveDead}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tips */}
            {guideContent.tips && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.tips.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.tips.maxProfit}</div>
                  <div>{guideContent.tips.burnedTokens}</div>
                </div>
              </div>
            )}
            
            {/* Vision */}
            {guideContent.vision && (
              <div className='space-y-2'>
                <div className='font-semibold text-cyan-300'>{guideContent.vision.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.vision.plans}</div>
                  <div>{guideContent.vision.noBonuses}</div>
                  <div>{guideContent.vision.decentralized}</div>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Fallback
      return <div className='text-slate-300'>Game guide content not available</div>;
    } catch (error) {
      return <div className='text-slate-300'>Error loading game guide</div>;
    }
  };

  if (!mounted)
    return (
      <div className='min-h-screen bg-gradient-to-br from-sky-900 via-cyan-900 to-sky-900 flex items-center justify-center text-white'>
        {t('common.loading', 'Loading...')}
      </div>
    );

  return (
    <div
      className='min-h-screen mobile-content-wrapper relative bg-gradient-to-br from-sky-900 via-cyan-900 to-sky-900 p-4'
    >
      {/* Full screen gradient background */}
      <div className='fixed inset-0 -z-10 bg-gradient-to-br from-sky-900 via-cyan-900 to-sky-900' />
      
      {/* Cosmic rain of golden cubes - always show */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        <CoinsAnimation intensity={isMobile ? 0.8 : 1.4} theme='blue' />
        <ParticleEffect
          count={isMobile ? 8 : 20}
          colors={['#38bdf8', '#06b6d4', '#0ea5e9']}
          speed={isMobile ? 0.2 : 0.5}
          size={isMobile ? 2 : 5}
        />
      </div>
      
      <div className='container mx-auto relative z-10'>
        <header className='mb-4 flex items-center justify-between mobile-header-fix mobile-safe-layout'>
          <Link href='/'>
            <Button
              variant='outline'
              className='border-cyan-500/30 bg-black/20 text-cyan-300 hover:bg-black/40 mobile-safe-button'
            >
              <ArrowLeft className='mr-2 w-4 h-4' />{' '}
              {t('navigation.home', 'Home')}
            </Button>
          </Link>
          {!isMobile && <TabNavigation />}
          <WalletConnect />
        </header>

        {/* Page Title and Info */}
        <div className='text-center mb-3'>
          <p className='text-cyan-300/80 text-xs font-medium leading-relaxed max-w-xl mx-auto'>
            {t(
              'ping.description',
              'Ping your NFTs every 10 days to earn CRA tokens! Your bonus grows with consistent pinging.'
            )}
          </p>
        </div>

        {!isConnected ? (
          <div className='text-center py-12'>
            <SatelliteDish className='w-12 h-12 text-cyan-400 mx-auto mb-4' />
            <p className='text-cyan-200 mb-4'>
              {t('ping.connectWallet', 'Connect wallet to view your cubes')}
            </p>
            <Button
              onClick={handleConnect}
              className='bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500'
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
          <div className='text-center text-cyan-200'>
            {t('common.loadingNFTs', 'Loading NFTs...')}
          </div>
        ) : nfts.length === 0 ? (
          <div className='text-center text-cyan-200'>
            {t('ping.noNFTs', 'No CrazyCube NFTs found.')}
          </div>
        ) : (
          <LazyLoad
            placeholder={<Skeleton className='h-64 w-full bg-sky-800/30' />}
          >
            <div className='nft-card-grid'>
              {nfts.map((nft, idx) => (
                <NFTPingCard
                  key={idx}
                  nft={nft}
                  index={idx}
                  onActionComplete={() => {
                    refetch();
                    handlePingSuccessWrapper();
                  }}
                />
              ))}
            </div>
          </LazyLoad>
        )}
      </div>

      {/* Auto-show Game Guide Modal */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className='max-w-2xl max-h-[80vh] bg-slate-900 border-slate-700'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold text-white flex items-center'>
              <BookOpen className='w-5 h-5 mr-2 text-cyan-400' />
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
