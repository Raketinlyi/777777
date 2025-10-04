'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IpfsImage } from '@/components/IpfsImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  SatelliteDish,
  Star,
  Clock,
} from 'lucide-react';
import { useCrazyOctagonGame, type NFTGameData } from '@/hooks/useCrazyOctagonGame';
import { useToast } from '@/hooks/use-toast';
import { monadChain } from '@/config/chains';
import type { NFT } from '@/types/nft';
import { useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { useContractGlobalData } from '@/hooks/useContractBatch';
// import { useMobile } from '@/hooks/use-mobile';
import { getColor, getLabel } from '@/lib/rarity';
import CoinBurst from '@/components/CoinBurst';
import { useTranslation } from 'react-i18next';
import { useMonadGuard } from '@/hooks/use-monad-guard';
import { cn } from '@/lib/utils';
import { SECURITY_CONFIG, validateChainId, validateContractAddress } from '@/config/security';
import DOMPurify from 'isomorphic-dompurify';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Use address from config instead of hardcoding
const GAME_ADDR = monadChain.contracts.gameProxy.address;
// const CRAA_ADDR = monadChain.contracts.crazyToken.address;
// const CHAIN_ID = monadChain.id;

// Helper function to format numbers
// const formatNumber = (num: number) => {
//   if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
//   if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
//   return num.toString();
// };

interface NFTPingCardProps {
  nft: NFT;
  index?: number;
  onActionComplete?: () => void;
  tooltipsEnabled?: boolean;
}

function NFTPingCardComponent({
  nft,
  index = 0,
  onActionComplete,
  tooltipsEnabled = true,
}: NFTPingCardProps) {
  const tokenIdDec = nft.tokenId.toString();
  // Removed isLiteMode - always show full effects
  const { getNFTGameData, pingNFT, isConnected, pingInterval } =
    useCrazyOctagonGame();
  const { toast } = useToast();
  const [gameData, setGameData] = useState<NFTGameData | null>(null);
  // removed unused loading state to satisfy linter and reduce noise
  const [isProcessing, setIsProcessing] = useState(false);
  const [earnings, setEarnings] = useState<
    | null
    | {
        sharePerPingWeiFormatted?: string;
        rarityBps?: string;
        multiplierBps?: string;
        rarity?: number;
        basePerHour?: bigint;
        totalPerHour?: bigint;
        basePerDay?: bigint;
        totalPerDay?: bigint;
        bonusPercent?: number;
        rarityPercent?: number;
        streakPercent?: number;
        basePerPing?: bigint;
        bonusPerPing?: bigint;
        totalPerPing?: bigint;
      }
  >(null);
  const { t } = useTranslation();
  const chainId = useChainId();
  // Use Monad Guard instead of ApeChain
  const { isMonadChain, requireMonadChain } = useMonadGuard();
  // const { isMobile } = useMobile();

  // Show warning if not on Monad Testnet - removed as useMonadGuard handles this
  // useEffect(() => {
  //   if (!isMonadChain && isConnected) {
  //     toast({
  //       title: 'Wrong Network',
  //       description: 'Please switch to Monad Testnet to interact with CrazyCube!',
  //       variant: 'destructive',
  //     });
  //   }
  // }, [isMonadChain, isConnected, toast]);

  // Fetch game data on mount
  useEffect(() => {
    if (!tokenIdDec) return;
    let cancelled = false;
    const load = async () => {
      try {
        const gd = await getNFTGameData(tokenIdDec);
        if (!cancelled) setGameData(gd);
  } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tokenIdDec, getNFTGameData]);

  // Use batched global data hook - much more efficient!
  const { data: globalData } = useContractGlobalData();

  // Calculate earnings from global data + gameData
  useEffect(() => {
    if (!globalData || !gameData) return;

    const rarity = gameData.rarity ?? 0;
    const sharePerPingWei = globalData.sharePerPing;
    const rarityBps = globalData.rarityBonuses[rarity as 1 | 2 | 3 | 4 | 5 | 6] ?? 0n;
    
    // Get dynamic bonus from gameData (streak multiplier)
    const dynBonus = BigInt(gameData.dynBonusBps ?? 0);
    const multiplierBps = 10000n + dynBonus;

    // Calculate rewards
    const basePerPingWei = sharePerPingWei;
    const withRarityWeiPing = basePerPingWei + (basePerPingWei * rarityBps) / 10000n;
    const totalPerPingWei = (withRarityWeiPing * multiplierBps) / 10000n;

    // Daily and hourly calculations
    const basePerDayWei = basePerPingWei;
    const totalPerDayWei = (basePerPingWei * (10000n + rarityBps)) / 10000n;
    const basePerHourWei = basePerDayWei / 24n;
    const totalPerHourWei = totalPerDayWei / 24n;

    // Convert to percentages
    const rarityPercent = Number(rarityBps) / 100;
    const streakPercent = (Number(multiplierBps) - 10000) / 100;
    const bonusPercent = rarityPercent + streakPercent;

    setEarnings({
      sharePerPingWeiFormatted: formatEther(sharePerPingWei),
      rarityBps: rarityBps.toString(),
      multiplierBps: multiplierBps.toString(),
      rarity,
      basePerHour: basePerHourWei,
      totalPerHour: totalPerHourWei,
      basePerDay: basePerDayWei,
      totalPerDay: totalPerDayWei,
      bonusPercent,
      rarityPercent,
      streakPercent,
      basePerPing: basePerPingWei,
      bonusPerPing: totalPerPingWei - basePerPingWei,
      totalPerPing: totalPerPingWei,
    });
  }, [globalData, gameData]);

  // Derived status – convert bigint values (from contract) to number for UI calculations
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));

  // Tick every second to keep countdown fresh and update pending values
  useEffect(() => {
    const id = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const lastPingTimeSec = gameData ? Number(gameData.lastPingTime) : 0;
  const isActivated = lastPingTimeSec !== 0;
  const pingReady = gameData
    ? !isActivated || nowSec > lastPingTimeSec + pingInterval
    : false;
  const timeLeft = gameData
    ? Math.max(0, lastPingTimeSec + pingInterval - nowSec)
    : 0;

  const formatDuration = (sec: number): string => {
    if (sec <= 0) return '0s';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handlePing = requireMonadChain(async () => {
    if (!isConnected) {
      toast({
        title: t('wallet.notConnected', 'Wallet not connected'),
        variant: 'destructive',
      });
      return;
    }

    // CRITICAL: Validate chainId to prevent network spoofing
    if (!validateChainId(chainId)) {
      toast({
        title: t('wallet.wrongNetwork', 'Wrong Network'),
        description: t('wallet.switchToMonadChain', 'Please switch to Monad Testnet'),
        variant: 'destructive',
      });
      return;
    }

    // CRITICAL: Validate contract addresses
    const expectedGameContract = SECURITY_CONFIG.CONTRACTS.GAME_CONTRACT;
    if (!validateContractAddress(expectedGameContract)) {
      toast({
        title: 'Security Error',
        description: 'Invalid game contract address',
        variant: 'destructive',
      });
      return;
    }

    if (!pingReady) return;
    try {
      setIsProcessing(true);
      await pingNFT(tokenIdDec);
      toast({ title: t('ping.sentFor', `Ping sent for #${tokenIdDec}`) });
      // refetch data
      const updated = await getNFTGameData(tokenIdDec);
      setGameData(updated);
      if (onActionComplete) onActionComplete();
    } catch (e: unknown) {
      // CRITICAL: XSS Protection - sanitize error message
  const errMsg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : undefined;
      const sanitizedMessage = errMsg
        ? DOMPurify.sanitize(errMsg as string, { 
            ALLOWED_TAGS: [], 
            ALLOWED_ATTR: [] 
          })
        : 'Unknown error occurred';
      
      toast({
        title: t('ping.error', 'Ping error'),
        description: sanitizedMessage,
        variant: 'destructive',
      });
    } finally {
     setIsProcessing(false);
    }
  });

  // Format CRAA with proper wei to CRAA conversion
  const formatCRADisplay = (wei: bigint): string => {
    const craAmount = parseFloat(formatEther(wei));
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(craAmount);
  };

  // More precise CRAA formatting for tooltips (default 6 fraction digits)
  const formatCRADisplayFull = (wei: bigint, fractionDigits = 6): string => {
    const craAmount = parseFloat(formatEther(wei));
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(craAmount);
  };

  // Percent formatting helper with fixed decimals
  const formatPercent = (val: number | undefined, digits = 1): string => {
    if (typeof val !== 'number' || Number.isNaN(val)) return '0.0%';
    const sign = val >= 0 ? '' : '';
    return `${sign}${val.toFixed(digits)}%`;
  };

  // Thousands separator for plain numbers (e.g., locked CRAA/raw)
  const formatWithSeparators = (val: number | string): string => {
    const num = typeof val === 'string' ? Number(val) : val;
    if (!Number.isFinite(num)) return String(val);
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 6,
    }).format(num);
  };

  // Format CRAA amounts with T/B/M/K suffixes
  const formatOCTAA = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Helper: optionally wrap with tooltip
  const withTooltip = (trigger: React.ReactElement, content: React.ReactNode) => {
    if (!tooltipsEnabled) return trigger;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side='top' className='max-w-[240px] text-xs leading-snug'>
          {content}
        </TooltipContent>
      </Tooltip>
    );
  };

  // const highlightClass = 'font-mono tabular-nums text-purple-50';

  // Calculate CRAA accumulated and available to collect with the next ping
  // Show pending for all activated NFTs, even in cooldown
  // const pendingPeriods =
  //   isActivated && pingInterval > 0
  //     ? Math.floor((nowSec - lastPingTimeSec) / pingInterval)
  //     : 0;

  // Calculate partial pending for NFTs in cooldown (show accumulated even if period not complete)
  const partialPendingWei =
    earnings && earnings.totalPerPing && isActivated && pingInterval > 0
      ? (earnings.totalPerPing * BigInt(nowSec - lastPingTimeSec)) /
        BigInt(pingInterval)
      : 0n;

  // const pendingWei = earnings
  //   ? earnings.totalPerPing * BigInt(pendingPeriods)
  //   : 0n;

  // Use partial pending for all activated NFTs to show real-time accumulation
  const displayPendingWei = partialPendingWei;

  // Inject magical animations CSS
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      @keyframes float-particle-0 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        25% { transform: translateY(-8px) translateX(4px); }
        50% { transform: translateY(-4px) translateX(-2px); }
        75% { transform: translateY(-12px) translateX(3px); }
      }
      @keyframes float-particle-1 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        33% { transform: translateY(-6px) translateX(-3px); }
        66% { transform: translateY(-10px) translateX(5px); }
      }
    `;
    if (!document.querySelector('#nft-card-animations')) {
      style.id = 'nft-card-animations';
      document.head.appendChild(style);
    }
  }, []);

  // Get locked OCTAA amount from gameData
  const lockedOcta = gameData ? Number(gameData.lockedOcta) : 0;

  // Calculate time accumulation information
  const timeSinceLastPing = isActivated ? nowSec - lastPingTimeSec : 0;
  const timeUntilNextPing = pingReady ? 0 : timeLeft;

  // Format time accumulation
  const formatTimeAccumulation = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format time until next ping
  const formatTimeUntilPing = (seconds: number): string => {
    if (seconds <= 0) return 'Ready!';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Gray filter only if NFT cannot be pinged yet
  const hasActiveCooldown = !pingReady;

  // Dynamic card styling based on state
  const getCardTheme = () => {
    if (!isActivated) {
      // Inactive NFTs - warm orange/amber theme
      return {
        cardClass: 'bg-gradient-to-br from-amber-950/80 via-orange-900/60 to-amber-950/80 border-amber-500/40 hover:border-amber-400/70 hover:shadow-[0_20px_40px_rgba(251,191,36,0.15)]',
        accentBar: 'bg-gradient-to-r from-amber-400/70 via-orange-400/70 to-amber-500/70',
        cornerGlow: 'bg-amber-400/15'
      };
    } else if (pingReady) {
      // Ready to ping - vibrant green/emerald theme
      return {
        cardClass: 'bg-gradient-to-br from-emerald-950/80 via-green-900/60 to-emerald-950/80 border-emerald-500/40 hover:border-emerald-400/70 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)]',
        accentBar: 'bg-gradient-to-r from-emerald-400/70 via-green-400/70 to-emerald-500/70',
        cornerGlow: 'bg-emerald-400/15'
      };
    } else {
      // Cooldown - dark gray theme with minimal color
      return {
        cardClass: 'bg-gradient-to-br from-gray-900/90 via-slate-800/80 to-gray-900/90 border-gray-600/30 hover:border-gray-500/50 hover:shadow-[0_20px_40px_rgba(107,114,128,0.1)]',
        accentBar: 'bg-gradient-to-r from-gray-500/50 via-slate-400/50 to-gray-500/50',
        cornerGlow: 'bg-gray-400/10'
      };
    }
  };

  const cardTheme = getCardTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className='group w-full max-w-[300px] mx-auto'
    >
      <Card
        className={cn(
          'flex flex-col relative overflow-hidden border-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-[0_12px_25px_rgba(0,0,0,0.35)] backdrop-blur-md',
          cardTheme.cardClass,
          hasActiveCooldown && 'opacity-85 saturate-50 brightness-75'
        )}
      >
        {/* Tooltips rendered inline; provider optional */}
        {/* Glassmorphism overlay */}
        <div className='absolute inset-0 bg-white/5 backdrop-blur-sm' />
        
        {/* Magical aura effect for ready cards - removed spinning */}
        {pingReady && (
          <div className='absolute inset-0 pointer-events-none'>
            <div 
              className='absolute inset-2 rounded-lg opacity-50'
              style={{
                background: 'radial-gradient(circle at center, #10B98120, transparent)',
                animation: 'pulse 3s ease-in-out infinite',
              }}
            />
          </div>
        )}
        
        {/* Sparkle effects for special states */}
        {!isActivated && (
          <div className='absolute inset-0 pointer-events-none overflow-hidden rounded-xl'>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className='absolute w-1 h-1 bg-amber-300 rounded-full opacity-80'
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 80}%`,
                  animation: `twinkle ${2 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  filter: 'blur(0.5px)',
                  boxShadow: '0 0 6px #FBBF24',
                }}
              />
            ))}
          </div>
        )}
        
        {/* Top accent bar with theme colors */}
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-[3px]', cardTheme.accentBar)} />
        
        {/* Themed corner glow */}
        <div className={cn('pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl', cardTheme.cornerGlow)} />
        
        {/* Bottom subtle glow */}
        <div className={cn('pointer-events-none absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl opacity-30', cardTheme.cornerGlow)} />
        
        {/* Floating energy particles for activated cards */}
        {isActivated && (
          <div className='absolute inset-0 pointer-events-none overflow-hidden rounded-xl'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='absolute w-0.5 h-0.5 rounded-full opacity-60'
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${20 + i * 15}%`,
                  background: pingReady ? '#10B981' : '#06B6D4',
                  animation: `float-particle-${i % 2} ${3 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                  filter: 'blur(0.5px)',
                  boxShadow: `0 0 4px ${pingReady ? '#10B981' : '#06B6D4'}`,
                }}
              />
            ))}
          </div>
        )}
        {/* Make the card a flex column to push the button to the bottom */}
        <div className='flex flex-col h-full relative z-10'>
          <CardHeader className='pb-2'>
            <div className='aspect-square rounded-lg overflow-hidden relative w-full shadow-lg max-w-[140px] mx-auto ring-2 ring-white/20'>
              {nft.image ? (
                <IpfsImage
                  src={nft.image}
                  alt={`CrazyCube #${tokenIdDec}`}
                  width={140}
                  height={140}
                  className='w-full h-full object-cover'
                  priority={index < 6}
                  loading={index < 6 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-[#C4B5FD] to-[#93C5FD] flex items-center justify-center' />
              )}
              {gameData && (
                <>
                  {/* Rarity badge at very top-left */}
                  <Badge
                    className={`absolute top-1 left-1 ${getColor(gameData.rarity)} text-white text-[8px] px-1 py-0 rounded shadow-lg`}
                  >
                    {getLabel(gameData.rarity)}
                  </Badge>
                  {!isActivated && (
                    <div className='absolute bottom-1 left-1 bg-orange-500/90 text-[9px] text-white px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm'>
                      Activate
                    </div>
                  )}
                  {/* Stars: vertical column on the right side of the image */}
                  <div className='absolute top-1 right-1 flex flex-col gap-[2px] bg-black/40 backdrop-blur-sm rounded px-0.5 py-0.5'>
                    {(() => {
                      const total = Math.max(1, Math.min(6, gameData.initialStars || gameData.rarity || 1));
                      const filled = Math.max(0, Math.min(total, gameData.currentStars || 0));
                      return Array.from({ length: total }).map((_, idx) => {
                        const isFilled = idx < filled;
                        return (
                          <Star
                            key={idx}
                            className={cn(
                              'w-2.5 h-2.5 drop-shadow-sm',
                              'text-yellow-300'
                            )}
                            // Fill remaining stars; outline for spent ones
                            fill={isFilled ? 'currentColor' : 'none'}
                          />
                        );
                      });
                    })()}
                  </div>
                  {/* Gender badge (on-chain) */}
                  {typeof gameData.gender === 'number' && (
                    <div
                      className={cn(
                        'absolute bottom-1 right-1 text-[11px] font-bold px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm',
                        gameData.gender === 1
                          ? 'bg-blue-600/70 text-blue-100'
                          : gameData.gender === 2
                          ? 'bg-pink-600/70 text-pink-100'
                          : 'bg-gray-600/70 text-gray-100'
                      )}
                      title='On-chain gender (fetched directly from contract)'
                      aria-label='On-chain gender (fetched directly from contract)'
                    >
                      {gameData.gender === 1 ? '♂' : gameData.gender === 2 ? '♀' : '∅'}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className='mt-1 text-center'>
              <h3 className='font-semibold text-white text-xs mb-0.5 drop-shadow-sm'>
                #{tokenIdDec}
              </h3>
              {pingReady ? (
                <div className='flex items-center justify-center gap-1 text-[9px]'>
                  <div className='w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm animate-pulse'></div>
                  <span className='text-emerald-200 font-medium drop-shadow-sm'>
                    {t('ping.readyToPing', 'Ready to Ping')}
                  </span>
                </div>
              ) : (
                <div className='flex items-center justify-center gap-1 text-[9px] text-amber-200'>
                  <Clock className='w-2.5 h-2.5 drop-shadow-sm' />
                  <span className='drop-shadow-sm'>{formatDuration(timeLeft)} left</span>
                </div>
              )}
              {/* Auto-refresh indicator */}
              <div className='flex items-center justify-center mt-1'>
                <div className='w-0.5 h-0.5 rounded-full bg-white/60 animate-pulse'></div>
                <span className='text-[7px] text-white/70 ml-1 drop-shadow-sm'>
                  {t('sections.ping.live', 'Live')}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className='flex-grow pt-1 pb-2 px-3 text-[10px] space-y-1 relative z-10'>
            <div className='flex justify-between items-center text-white/80 min-w-0 gap-2'>
              <span>{t('sections.ping.basePerHour', 'Base/h')}</span>
              {withTooltip(
                <span
                  className='tabular-nums font-mono font-black text-[10px] text-blue-200 ml-2 text-right truncate max-w-[60%] drop-shadow-lg bg-blue-600/25 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  title={earnings ? `${formatCRADisplayFull(earnings?.basePerHour ?? 0n)} CRAA/h` : undefined}
                  aria-label={earnings ? `${formatCRADisplayFull(earnings?.basePerHour ?? 0n)} CRAA per hour` : undefined}
                >
                  {earnings ? formatCRADisplay(earnings?.basePerHour ?? 0n) : '...'}
                </span>,
                t('tooltips.basePerHour', 'Base CRAA accrued per hour (before bonuses).')
              )}
            </div>
            {/* Gender (on-chain) */}
            <div className='flex justify-between items-center min-w-0 gap-2'>
              <span>{t('ping.gender', 'Gender')}</span>
              {withTooltip(
                <span
                  className={cn(
                    'tabular-nums font-mono font-black text-[10px] ml-2 text-right truncate max-w-[60%] drop-shadow-lg px-2 py-1 rounded-md',
                    gameData?.gender === 1
                      ? 'text-blue-100 bg-blue-600/25 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                      : gameData?.gender === 2
                      ? 'text-pink-100 bg-pink-600/25 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                      : 'text-gray-200 bg-gray-600/25 shadow-[0_0_8px_rgba(107,114,128,0.3)]'
                  )}
                  title='On-chain: value read directly from game contract'
                  aria-label='On-chain: value read directly from game contract'
                >
                  {gameData?.gender === 1 ? '♂ Male' : gameData?.gender === 2 ? '♀ Female' : 'Unknown'}
                </span>,
                'Data is fetched on-chain directly from the game contract'
              )}
            </div>
            <div className='flex justify-between items-center text-amber-200 min-w-0 gap-2'>
              <span>{t('ping.rarity', 'Rarity')}</span>
              {withTooltip(
                <span
                  className='tabular-nums font-mono font-black text-[10px] text-amber-100 ml-2 text-right truncate max-w-[60%] drop-shadow-lg bg-amber-600/25 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  title={earnings ? `${formatPercent(earnings?.rarityPercent, 2)} rarity` : undefined}
                  aria-label={earnings ? `${formatPercent(earnings?.rarityPercent, 2)} rarity` : undefined}
                >
                  +{earnings ? (earnings?.rarityPercent?.toFixed(1) ?? '0') : 0}%
                </span>,
                t('tooltips.rarity', 'Bonus from NFT rarity (basis points converted to %).')
              )}
            </div>
            <div className='flex justify-between items-center text-white/80 min-w-0 gap-2'>
                <span>
                  {(earnings?.streakPercent ?? 0) >= 0
                    ? t('ping.streak', 'Streak')
                    : t('ping.penalty', 'Penalty')}
                </span>
              {withTooltip(
              <span className={cn(
                'tabular-nums font-mono font-black text-[10px] ml-2 text-right truncate max-w-[60%] drop-shadow-lg px-2 py-1 rounded-md',
                (earnings?.streakPercent ?? 0) >= 0 
                  ? 'text-green-200 bg-green-600/25 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                  : 'text-red-200 bg-red-600/25 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
              )}
                title={earnings ? `${formatPercent(earnings?.streakPercent, 2)} streak` : undefined}
                aria-label={earnings ? `${formatPercent(earnings?.streakPercent, 2)} streak` : undefined}
              >
                {(earnings?.streakPercent ?? 0) >= 0 ? '+' : ''}
                {earnings ? (earnings?.streakPercent?.toFixed(1) ?? '0') : 0}%
              </span>,
              t('tooltips.streak', 'Experience streak bonus/penalty based on regular pinging.')
              )}
            </div>
            <div className='flex justify-between items-center text-white/80 min-w-0 gap-2'>
              <span>{t('ping.totalBonus', 'Total Bonus')}</span>
              {withTooltip(
              <span className={cn(
                'tabular-nums font-mono font-black text-[10px] ml-2 text-right truncate max-w-[60%] drop-shadow-lg px-2 py-1 rounded-md',
                (earnings?.bonusPercent ?? 0) >= 0 
                  ? 'text-purple-200 bg-purple-600/25 shadow-[0_0_8px_rgba(147,51,234,0.4)]' 
                  : 'text-red-200 bg-red-600/25 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
              )}
                title={earnings ? `${formatPercent(earnings?.bonusPercent, 2)} total` : undefined}
                aria-label={earnings ? `${formatPercent(earnings?.bonusPercent, 2)} total` : undefined}
              >
                {(earnings?.bonusPercent ?? 0) >= 0 ? '+' : ''}
                {earnings ? (earnings?.bonusPercent?.toFixed(1) ?? '0') : 0}%
              </span>,
              t('tooltips.totalBonus', 'Total bonus applied (rarity + streak).')
              )}
            </div>
            <div className='flex justify-between items-center text-yellow-200 font-semibold min-w-0 gap-2'>
              <span>{t('ping.24h', '24h')}</span>
              {withTooltip(
                <span
                  className='tabular-nums font-mono font-black text-[11px] text-yellow-100 ml-2 text-right truncate max-w-[60%] drop-shadow-lg bg-yellow-600/25 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                  title={earnings ? `${formatCRADisplayFull(earnings?.totalPerDay ?? 0n)} CRAA/24h` : undefined}
                  aria-label={earnings ? `${formatCRADisplayFull(earnings?.totalPerDay ?? 0n)} CRAA per 24 hours` : undefined}
                >
                  {earnings ? formatCRADisplay(earnings?.totalPerDay ?? 0n) : '...'}
                </span>,
                t('tooltips.day24', 'Projected CRAA in 24 hours with current bonuses.')
              )}
            </div>
            <div className='flex justify-between items-center text-lime-200 font-semibold min-w-0 gap-2'>
              <span>{t('ping.pending', 'Pending')}</span>
              {withTooltip(
              <span
                className={cn(
                  'tabular-nums font-mono font-black text-[11px] ml-2 text-right truncate max-w-[60%] drop-shadow-lg px-2 py-1 rounded-md',
                  isActivated &&
                    parseFloat(
                      formatCRADisplay(displayPendingWei)
                    ) > 0
                    ? 'text-lime-100 bg-lime-500/35 animate-pulse backdrop-blur-sm shadow-[0_0_12px_rgba(132,204,22,0.6)]'
                    : isActivated
                    ? 'text-lime-200 bg-lime-600/20 animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.3)]'
                    : 'text-lime-100 bg-lime-600/20 shadow-[0_0_6px_rgba(132,204,22,0.2)]'
                )}
                title={`${formatCRADisplayFull(displayPendingWei)} CRAA pending`}
                aria-label={`${formatCRADisplayFull(displayPendingWei)} CRAA pending`}
              >
                {earnings
                  ? formatCRADisplay(displayPendingWei)
                  : '0.00'}
              </span>,
              t('tooltips.pending', 'Accrued since last ping. Will be collected on next ping.')
              )}
            </div>
            {/* Time accumulation info - show for all activated NFTs */}
            {isActivated ? (
              <div className='flex justify-between items-center text-white/70 text-[9px] min-w-0 gap-2'>
                <span>⏰ {t('sections.ping.accumulated', 'Accumulated')}</span>
                <span className='font-mono font-black text-[10px] text-indigo-200 ml-2 text-right truncate max-w-[60%] drop-shadow-lg bg-indigo-600/25 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(99,102,241,0.3)]'>
                  {formatTimeAccumulation(timeSinceLastPing)}
                </span>
              </div>
            ) : (
              <div className='flex justify-between items-center text-gray-400 text-[9px] min-w-0 gap-2'>
                <span>&nbsp;</span>
                <span className='font-mono font-black text-[10px] text-gray-300 ml-2 text-right truncate max-w-[60%] bg-gray-600/25 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(107,114,128,0.2)]'>
                  Not Activated
                </span>
              </div>
            )}
            {/* Time until next ping - only show if not ready */}
            {!pingReady && (
              <div className='flex justify-between items-center text-amber-200 text-[9px] min-w-0 gap-2'>
                <span>⏳ {t('sections.ping.nextPing', 'Next Ping')}</span>
                <span className='tabular-nums font-mono font-black text-[10px] text-orange-200 ml-2 text-right truncate max-w-[60%] drop-shadow-lg bg-orange-600/25 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(251,146,60,0.4)]'>
                  {formatTimeUntilPing(timeUntilNextPing)}
                </span>
              </div>
            )}
            <div className='flex justify-between items-center text-white/80 font-semibold min-w-0 gap-2'>
              <span>{t('ping.lockedOcta', 'Locked OCTAA')}</span>
              {withTooltip(
              <span
                className={cn(
                  'tabular-nums font-mono font-black text-[10px] ml-2 text-right truncate max-w-[60%] drop-shadow-lg px-2 py-1 rounded-md text-black',
                  hasActiveCooldown && parseFloat(lockedOcta.toString()) > 0
                    ? 'bg-pink-600/25 animate-pulse backdrop-blur-sm shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                    : 'bg-pink-600/20 shadow-[0_0_6px_rgba(236,72,153,0.2)]'
                )}
                title={`${formatWithSeparators(lockedOcta)} OCTAA locked`}
                aria-label={`${formatWithSeparators(lockedOcta)} OCTAA locked`}
              >
                <span className='font-black text-black'>
                  {formatOCTAA(lockedOcta)}
                </span>
              </span>,
              t('tooltips.lockedOcta', 'OCTA temporarily locked by game mechanics (e.g., pending burn/breed).')
              )}
            </div>
            {/* Status line for ready NFTs to match cooldown NFT line count */}
            {pingReady && (
              <div className='flex justify-between items-center text-white/70 text-[9px] min-w-0 gap-2'>
                <span>{t('ping.status', 'Status')}</span>
                <span className='font-mono font-black text-[10px] text-emerald-200 ml-2 text-right truncate max-w-[60%] drop-shadow-lg bg-emerald-600/25 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(16,185,129,0.4)]'>
                  {t('ping.active', 'Active')}
                </span>
              </div>
            )}
          </CardContent>

          {/* Ping button */}
          <div className='px-2 pb-2 relative z-10'>
            <CoinBurst key={String(nft.tokenId)} total={18} duration={0.8}>
              <Button
                variant={pingReady ? 'default' : 'outline'}
                size='sm'
                className={cn(
                  'w-full h-7 text-xs font-semibold transition-all duration-300',
                  pingReady
                    ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:from-emerald-400 hover:to-green-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                    : !isActivated
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:from-amber-400 hover:to-orange-500 border-0'
                    : 'border-gray-500/40 bg-gray-800/40 text-gray-300 hover:bg-gray-700/50 hover:border-gray-400/60 backdrop-blur-sm'
                )}
                onClick={handlePing}
                disabled={isProcessing || !pingReady}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />{' '}
                    Processing...
                  </>
                ) : (
                  <>
                    <SatelliteDish className='mr-2 h-4 w-4' />{' '}
                    {isActivated
                      ? t('ping.ping', 'Ping')
                      : t('sections.ping.activate', 'Activate')}
                  </>
                )}
              </Button>
            </CoinBurst>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
export default React.memo(NFTPingCardComponent, (prev, next) => {
  return (
    prev.nft.id === next.nft.id &&
    prev.nft.stars === next.nft.stars &&
    prev.nft.rewardBalance === next.nft.rewardBalance
  );
});

