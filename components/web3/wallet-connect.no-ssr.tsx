'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useBalance } from 'wagmi';
import { usePathname } from 'next/navigation';
import { useNetwork } from '@/hooks/use-network';
import { apeChain } from '@/config/chains';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wallet, AlertTriangle, Coins, BookOpen, Info, TrendingUp, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { safeOpen } from '@/lib/safeOpen';
import { toast } from '@/components/ui/use-toast';
import { CompactMusicPlayer } from '@/components/CompactMusicPlayer';
import Image from 'next/image';

// Constants for Camelot
const CRAA_ADDRESS = process.env.NEXT_PUBLIC_CRAA_ADDRESS || '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5';
const CAMELOT_LINK = `https://app.camelot.exchange/?token2=${CRAA_ADDRESS}&swap=v2`;
const DEXSCREENER_LINK = process.env.NEXT_PUBLIC_DEXSCREENER_LINK || 'https://dexscreener.com/apechain/0x7493b5d547c6d9f42ca1133dcd39e2472b633efc';

export function WalletConnectNoSSR() {
  const { isConnected, address } = useAccount();
  // const chainId = useChainId();
  const { isApeChain } = useNetwork();
  const { t } = useTranslation();
  const { open } = useWeb3Modal();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const pathname = usePathname();

  const { data: craBal } = useBalance({
    address,
    token: apeChain.contracts.crazyToken.address as `0x${string}`,
    chainId: apeChain.id,
    query: { enabled: !!address },
  });

  // Blinking effect
  useEffect(() => {
    if (isSwapOpen) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isSwapOpen]);

  const handleBuyClick = async () => {
    if (!window.ethereum) {
      safeOpen(CAMELOT_LINK);
      return;
    }

    try {
      // Switch to ApeChain (33139 = 0x8173)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x8173' }],
      });
  } catch {
      // Удаляем console.error для production безопасности
      // console.error('Switch error:', e);
      toast({
        title: t('wallet.switchError', 'Network switch failed'),
        description: t('wallet.switchErrorDesc', 'Please try again'),
        variant: 'destructive',
      });
    }

    safeOpen(CAMELOT_LINK);
  };

  // Format CRA balance nicely
  const formatCRABalance = (balance: string) => {
    const num = parseFloat(balance);
    if (!isFinite(num) || num < 0) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
      num
    );
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
  const guideContent = content as any;
        
        return (
          <div className='text-slate-300 text-sm leading-relaxed space-y-6'>
            {/* Title */}
            <div className='text-lg font-bold text-purple-400 mb-4'>
              {guideContent.title || '🎮 CrazyCube Game Guide'}
            </div>
            
            {/* Getting Started */}
            {guideContent.gettingStarted && (
              <div className='space-y-2'>
                <div className='font-semibold text-purple-300'>{guideContent.gettingStarted.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.gettingStarted.getCRAA}</div>
                  <div>{guideContent.gettingStarted.buyNFTs}</div>
                </div>
              </div>
            )}
            
            {/* How to Start */}
            {guideContent.howToStart && (
              <div className='space-y-2'>
                <div className='font-semibold text-purple-300'>{guideContent.howToStart.title}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.experienceBonus.title}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.howToGetCRAA.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.howToGetCRAA.accumulation}</div>
                  <div>{guideContent.howToGetCRAA.collect}</div>
                </div>
              </div>
            )}
            
            {/* How to Burn */}
            {guideContent.howToBurn && (
              <div className='space-y-2'>
                <div className='font-semibold text-purple-300'>{guideContent.howToBurn.title}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.howToRevive.title}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.crasInSystem.title}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.crasFees.title}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.exampleStrategy.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.exampleStrategy.youHaveThree}</div>
                  <div>{guideContent.exampleStrategy.common}</div>
                  <div>{guideContent.exampleStrategy.rare}</div>
                  <div>{guideContent.exampleStrategy.mystic}</div>
                  <div className='mt-2'>{guideContent.exampleStrategy.playCalmly}</div>
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
                <div className='font-semibold text-purple-300'>{guideContent.tips.title}</div>
                <div className='space-y-1 ml-4'>
                  <div>{guideContent.tips.maxProfit}</div>
                  <div>{guideContent.tips.burnedTokens}</div>
                </div>
              </div>
            )}
            
            {/* Vision */}
            {guideContent.vision && (
              <div className='space-y-2'>
                <div className='font-semibold text-purple-300'>{guideContent.vision.title}</div>
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
      return <div className='text-slate-300 text-sm'>Game guide content not available</div>;
  } catch {
      // Удаляем console.error для production безопасности
      // console.error('Error rendering game guide:', error);
      return null;
    }
  };

  return (
    <div className='flex items-center'>
      {!isConnected ? (
        <Button
          onClick={() => open()}
          className='neon-button border-0'
        >
          <Wallet className='w-4 h-4 mr-2' />
          {t('wallet.connect', 'Connect Wallet')}
        </Button>
      ) : !isApeChain ? (
          <Button
            onClick={() => open({ view: 'Networks' })}
          className='bg-red-600 hover:bg-red-700 text-white border-0'
        >
          <AlertTriangle className='w-4 h-4 mr-2' />
          {t('network.switch', 'Switch to ApeChain')}
        </Button>
      ) : (
        <div className='flex flex-col items-end gap-2'>
          <Button
            onClick={() => open()}
            className='neon-button border-0 min-w-[180px] px-4 py-2 text-sm font-medium'
          >
            <Wallet className='w-4 h-4 mr-2' />
            {address
              ? formatAddress(address)
              : t('wallet.connected', 'Connected')}
          </Button>

          {/* CRA Balance Display */}
          {craBal && (
            <div className='flex flex-col items-end gap-1'>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-amber-300/30 rounded-lg backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.15)]'>
                <div className='flex items-center gap-1'>
                  <Coins className='w-4 h-4 text-amber-400' />
                  <span className='text-xs font-medium text-amber-300'>
                    Balance:
                  </span>
                </div>
                <span className='text-sm font-bold text-amber-100 font-mono'>
                  {formatCRABalance(craBal.formatted)} CRAA
                </span>
              </div>

              {/* Blinking buy CRAA button */}
              <motion.div
                animate={{
                  boxShadow: isBlinking
                    ? '0 0 15px rgba(255, 183, 0, 0.6)'
                    : '0 0 0px rgba(255, 183, 0, 0)'
                }}
                transition={{ duration: 0.5 }}
                className="rounded-lg overflow-hidden"
              >
                <Button
                  onClick={() => setIsSwapOpen(true)}
                  className='w-full min-w-[180px] text-sm px-3 py-1.5 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:brightness-110 font-bold'
                >
                  🟡 {t('swap.camelot.button', 'Buy CRAA on Camelot')}
                </Button>
              </motion.div>

              {/* Game Guide Button */}
              <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='default'
                    className='w-full min-w-[180px] text-sm px-3 py-1.5 h-8 bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  >
                    <BookOpen className='w-4 h-4 mr-2' />
                    {t('wallet.instruction', 'Instruction')}
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-2xl max-h-[80vh] bg-slate-900 border-slate-700'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-bold text-white flex items-center'>
                      <BookOpen className='w-5 h-5 mr-2 text-purple-400' />
                      {t('wallet.gameGuide', 'CrazyCube Game Guide')}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className='h-[60vh] pr-4'>
                    {renderGameGuideContent()}
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {/* Compact Music Player only on non-home pages (persistent global audio) */}
              {pathname !== '/' && <CompactMusicPlayer />}

              {/* CRAA Buy Modal */}
              <Dialog open={isSwapOpen} onOpenChange={setIsSwapOpen}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] rounded-2xl bg-[#0b0e13] border border-white/10 shadow-[0_0_50px_rgba(255,183,0,.12)] overflow-y-auto">
                  <DialogHeader className="p-0 sticky top-0 bg-[#0b0e13] z-10">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        {t('swap.buyCRAA', 'Buy CRAA on Camelot')}
                      </DialogTitle>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Main content */}
                  <div className="px-5 py-4 space-y-4">
                    {/* Instructions */}
                    <div className="bg-purple-500/15 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="text-blue-300 text-sm space-y-2">
                          <div className="font-semibold">{t('swap.instructions.title', 'Instructions for buying CRAA:')}</div>
                          <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>{t('swap.instructions.step1', 'Click the "🟡 Buy CRAA on Camelot" button below')}</li>
                            <li>{t('swap.instructions.step2', 'Automatically switch to ApeChain network')}</li>
                            <li>{t('swap.instructions.step3', 'Set slippage: buy 3-5%, sell 10-15%')}</li>
                            <li>{t('swap.instructions.step4', 'Confirm transaction in wallet')}</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Detailed fees and slippage description */}
                    <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-4">
                      <div className="text-amber-300 text-sm space-y-3">
                        <div className="font-semibold text-base">{t('swap.fees.title', '💰 Fees and Slippage:')}</div>
                        
                        <div className="space-y-2">
                          <div className="font-medium">{t('swap.fees.buy.title', '🟢 Buy CRAA (APE → CRAA):')}</div>
                          <div className="text-xs space-y-1 ml-4">
                            <div>• <span className="text-green-300">{t('swap.fees.camelot', 'Camelot Fee:')}</span> {t('swap.fees.free', '0% (free)')}</div>
                            <div>• <span className="text-green-300">{t('swap.fees.slippage', 'Slippage:')}</span> {t('swap.fees.buy.slippage', '3-5% (recommended)')}</div>
                            <div>• <span className="text-green-300">{t('swap.fees.token.tax', 'Token Tax:')}</span> {t('swap.fees.buy.tax', '0% on purchase')}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="font-medium">{t('swap.fees.sell.title', '🔴 Sell CRAA (CRAA → APE):')}</div>
                          <div className="text-xs space-y-1 ml-4">
                            <div>• <span className="text-red-300">{t('swap.fees.camelot', 'Camelot Fee:')}</span> {t('swap.fees.free', '0% (free)')}</div>
                            <div>• <span className="text-red-300">{t('swap.fees.slippage', 'Slippage:')}</span> {t('swap.fees.sell.slippage', '10-15% (recommended)')}</div>
                            <div>• <span className="text-red-300">{t('swap.fees.token.tax', 'Token Tax:')}</span> {t('swap.fees.sell.tax', '10% (automatic)')}</div>
                            <div className="text-amber-200 font-medium">⚠️ {t('swap.fees.sell.total', 'Total on sale: 10-15% slippage + 10% tax')}</div>
                          </div>
                        </div>

                        <div className="bg-white/10 rounded-lg p-3 mt-3">
                          <div className="font-medium text-amber-200">{t('swap.slippage.what.title', '💡 What is slippage?')}</div>
                          <div className="text-xs text-amber-100 mt-1">
                            {t('swap.slippage.what.description', 'Slippage is the maximum price change you are willing to accept. In high volatility or low liquidity, the price may change between the moment the transaction is sent and its execution.')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot */}
                    <div className="bg-purple-500/15 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-purple-300 text-sm font-medium mb-3">{t('swap.screenshot.title', '📸 Example of Camelot settings:')}</div>
                        <div className="relative">
                          <Image
                            src="/images/1234.jpg"
                            alt={t('swap.screenshot.alt', 'Camelot settings example')}
                            width={1200}
                            height={600}
                            className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-purple-400/30 shadow-lg"
                            onError={(e: any) => {
                              e.currentTarget.style.display = 'none';
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextElement) {
                                nextElement.style.display = 'block';
                              }
                            }}
                            priority={false}
                          />
                          <div className="hidden text-purple-200 text-xs p-4 bg-purple-500/20 rounded-lg">
                            {t('swap.screenshot.fallback', 'Camelot settings screenshot will be added to /public/images/1234.jpg')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DexScreener button */}
                    <Button 
                      onClick={() => safeOpen(DEXSCREENER_LINK)}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:brightness-110 font-bold flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      📊 {t('swap.dexscreener.button', 'View CRAA rate on DexScreener')}
                    </Button>

                    {/* Blinking button */}
                    <motion.div
                      animate={{ 
                        boxShadow: isBlinking 
                          ? '0 0 20px rgba(255, 183, 0, 0.6)' 
                          : '0 0 0px rgba(255, 183, 0, 0)' 
                      }}
                      transition={{ duration: 0.5 }}
                      className="rounded-xl overflow-hidden"
                    >
                      <Button 
                        onClick={handleBuyClick}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:brightness-110 transition-all duration-300"
                      >
                        🟡 {t('swap.camelot.button', 'Buy CRAA on Camelot')}
                      </Button>
                    </motion.div>

                    {/* Explanation */}
                    <div className="text-center text-xs text-gray-400 space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>{t('swap.security', 'Secure purchase through Camelot V2')}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {t('swap.recommended.settings', 'Recommended settings: buy 3-5% slippage, sell 10-15% slippage')}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
