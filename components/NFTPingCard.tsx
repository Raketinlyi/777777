'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  SatelliteDish,
  Star,
  RefreshCw,
  Zap,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCrazyCubeGame, type NFTGameData } from '@/hooks/useCrazyCubeGame';
import { useToast } from '@/hooks/use-toast';
import { createPublicClient, http } from 'viem';
import { apeChain } from '@/config/chains';
import type { NFT } from '@/types/nft';
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useMobile } from '@/hooks/use-mobile';
import { getColor, getLabel } from '@/lib/rarity';
import CoinBurst from '@/components/CoinBurst';
import { useTranslation } from 'react-i18next';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { useNetwork } from '@/hooks/use-network';
import { cn } from '@/lib/utils';
import { SECURITY_CONFIG, validateChainId, validateContractAddress } from '@/config/security';
import DOMPurify from 'isomorphic-dompurify';

// Use address from config instead of hardcoding
const GAME_ADDR = apeChain.contracts.gameProxy.address;
const CRAA_ADDR = apeChain.contracts.crazyToken.address;
const CHAIN_ID = apeChain.id;

// Helper function to format numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

interface NFTPingCardProps {
  nft: NFT;
  index?: number;
  onActionComplete?: () => void;
}

function NFTPingCardComponent({
  nft,
  index = 0,
  onActionComplete,
}: NFTPingCardProps) {
  const tokenIdDec = nft.tokenId.toString();
  // Removed isLiteMode - always show full effects
  const { getNFTGameData, pingNFT, isConnected, pingInterval } =
    useCrazyCubeGame();
  const { toast } = useToast();
  const [gameData, setGameData] = useState<NFTGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const { t } = useTranslation();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isApeChain, requireApeChain } = useNetwork();
  const { isMobile } = useMobile();

  // Show warning if not on ApeChain
  useEffect(() => {
    if (!isApeChain && isConnected) {
      toast({
        title: 'Wrong Network',
        description: 'Please switch to ApeChain to interact with CrazyCube!',
        variant: 'destructive',
      });
    }
  }, [isApeChain, isConnected, toast]);

  // Fetch game data on mount
  useEffect(() => {
    if (!tokenIdDec) return;
    let cancelled = false;
    const load = async () => {
      try {
        const gd = await getNFTGameData(tokenIdDec);
        if (!cancelled) setGameData(gd);
      } catch (e) {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tokenIdDec, getNFTGameData]);

  // Fetch earnings and multiplier
  // ------------------------------------------------------
  // Existing effect renamed
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      if (!tokenIdDec) return;
      try {
        setLoading(true);
        const client = createPublicClient({
          chain: apeChain,
          transport: http(),
        });
        const MINI_ABI = [
          {
            name: 'sharePerPing',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ type: 'uint256' }],
          },
          {
            name: 'rarityBonusBps',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ type: 'uint8' }],
            outputs: [{ type: 'uint256' }],
          },
          {
            name: 'currentMultiplierBps',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ type: 'uint256' }],
            outputs: [{ type: 'uint256' }],
          },
        ] as const;

        const rarity = gameData?.rarity ?? 0;

        const [sharePerPingWei, rarityBps, multiplierBps] = await Promise.all([
          client.readContract({
            address: GAME_ADDR,
            abi: MINI_ABI,
            functionName: 'sharePerPing',
          }) as Promise<bigint>,
          client.readContract({
            address: GAME_ADDR,
            abi: MINI_ABI,
            functionName: 'rarityBonusBps',
            args: [rarity],
          }) as Promise<bigint>,
          client.readContract({
            address: GAME_ADDR,
            abi: MINI_ABI,
            functionName: 'currentMultiplierBps',
            args: [BigInt(tokenIdDec)],
          }) as Promise<bigint>,
        ]);

        if (!ignore)
          setEarnings({
            sharePerPingWeiFormatted: formatEther(sharePerPingWei),
            rarityBps: rarityBps.toString(),
            multiplierBps: multiplierBps.toString(),
            rarity,
          });

        // Rewards per ping (base) – already in wei
        const basePerPingWei = sharePerPingWei;

        // Total reward per ping with rarity bonus
        const withRarityWei =
          basePerPingWei + (basePerPingWei * rarityBps) / 10000n;
        const totalPerPingWei = (withRarityWei * multiplierBps) / 10000n;

        // Rewards per hour – depends on ping interval (contract value; default to 24h)
        const safeInterval = pingInterval || 86400;
        
        // Calculate periods per hour (for 24h interval, this will be 1/24)
        const periodsPerHour = safeInterval >= 3600 ? 
          BigInt(Math.floor(3600 / safeInterval)) : 
          BigInt(Math.floor(3600 / safeInterval));
        
        // For 24h interval, calculate daily rewards directly
        const basePerDayWei = basePerPingWei;
        const totalPerDayWei = (basePerPingWei * (10000n + rarityBps)) / 10000n;
        
        // Calculate hourly rewards (daily / 24)
        const basePerHourWei = basePerDayWei / 24n;
        const totalPerHourWei = totalPerDayWei / 24n;

        // Convert bonus from basis points (bps) to a human-friendly percent value
        const rarityPercent = Number(rarityBps) / 100;
        const streakPercent = (Number(multiplierBps) - 10000) / 100;
        const bonusPercent = rarityPercent + streakPercent;

        if (!ignore)
          setEarnings({
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
      } catch (err) {
          // Remove console.error for production security
          // console.error("Error fetching earnings:", err);
          setEarnings(null);
        }
        finally {

        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => {
      ignore = true;
    };
  }, [tokenIdDec, getNFTGameData, pingInterval, gameData]);

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

  const handlePing = requireApeChain(async () => {
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
        description: t('wallet.switchToApeChain', 'Please switch to ApeChain network'),
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
    } catch (e: any) {
      // CRITICAL: XSS Protection - sanitize error message
      const sanitizedMessage = e?.message 
        ? DOMPurify.sanitize(e.message, { 
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

  // Format CRAA amounts with T/B/M/K suffixes
  const formatCRAA = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const highlightClass = 'font-mono tabular-nums text-cyan-50';

  // Calculate CRAA accumulated and available to collect with the next ping
  // Show pending for all activated NFTs, even in cooldown
  const pendingPeriods =
    isActivated && pingInterval > 0
      ? Math.floor((nowSec - lastPingTimeSec) / pingInterval)
      : 0;

  // Calculate partial pending for NFTs in cooldown (show accumulated even if period not complete)
  const partialPendingWei =
    earnings && isActivated && pingInterval > 0
      ? (earnings.totalPerPing * BigInt(nowSec - lastPingTimeSec)) /
        BigInt(pingInterval)
      : 0n;

  const pendingWei = earnings
    ? earnings.totalPerPing * BigInt(pendingPeriods)
    : 0n;

  // Use partial pending for all activated NFTs to show real-time accumulation
  const displayPendingWei = partialPendingWei;

  // Get locked CRAA amount from gameData
  const lockedCRAA = gameData ? Number(gameData.lockedCRAA) : 0;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className='group w-full max-w-[280px] mx-auto'
    >
      <Card
        className={cn(
          'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 rounded-xl transition-all duration-300 hover:scale-105',
          hasActiveCooldown
            ? 'opacity-60 grayscale'
            : 'border-slate-700 hover:border-orange-500/50'
        )}
      >
        {/* Make the card a flex column to push the button to the bottom */}
        <div className='flex flex-col h-full'>
          <CardHeader className='pb-2'>
            <div className='aspect-square rounded-lg overflow-hidden relative w-full shadow-lg max-w-[80px] mx-auto'>
              {nft.image ? (
                <Image
                  src={nft.image}
                  alt={`CrazyCube #${tokenIdDec}`}
                  width={80}
                  height={80}
                  sizes='80px'
                  className='w-full h-full object-cover'
                  priority={index < 6}
                  loading={index < 6 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center' />
              )}
              {gameData && (
                <>
                  {/* Rarity badge at very top-left */}
                  <Badge
                    className={`absolute top-1 left-1 ${getColor(gameData.rarity)} text-white text-[7px] px-0.5 py-0 rounded shadow`}
                  >
                    {getLabel(gameData.rarity)}
                  </Badge>
                  {!isActivated && (
                    <div className='absolute bottom-1 left-1 bg-orange-600/80 text-[8px] text-white px-0.5 rounded'>
                      Activate
                    </div>
                  )}
                  {/* Stars: vertical column on the right side of the image */}
                  <div className='absolute top-1 right-1 flex flex-col gap-[2px] bg-black/60 rounded px-0.5 py-0.5'>
                    {Array.from({
                      length: Math.min(6, gameData.rarity || 1),
                    }).map((_, idx) => (
                      <Star key={idx} className='w-2 h-2 text-sky-400' />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className='mt-1 text-center'>
              <h3 className='font-semibold text-cyan-100 text-xs mb-0.5'>
                #{tokenIdDec}
              </h3>
              {pingReady ? (
                <div className='flex items-center justify-center gap-1 text-[9px]'>
                  <div className='w-1.5 h-1.5 rounded-full bg-green-400'></div>
                  <span className='text-green-300 font-medium'>
                    {t('sections.ping.readyToPing', 'Ready to Ping')}
                  </span>
                </div>
              ) : (
                <div className='flex items-center justify-center gap-1 text-[9px] text-orange-300'>
                  <Clock className='w-2.5 h-2.5' />
                  <span>{formatDuration(timeLeft)} left</span>
                </div>
              )}
              {/* Auto-refresh indicator */}
              <div className='flex items-center justify-center mt-1'>
                <div className='w-0.5 h-0.5 rounded-full bg-blue-400 animate-pulse'></div>
                <span className='text-[7px] text-blue-300 ml-1'>
                  {t('sections.ping.live', 'Live')}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className='flex-1 pt-0 pb-2 px-2 text-[9px] space-y-0.5'>
            <div className='flex justify-between items-center text-cyan-300 min-w-0 gap-2'>
              <span>{t('sections.ping.basePerHour', 'Base/h')}</span>
              <span className='font-mono font-semibold text-cyan-100 ml-2 text-right truncate max-w-[60%]'>
                {earnings ? formatCRADisplay(earnings.basePerHour) : '...'}
              </span>
            </div>
            <div className='flex justify-between items-center text-yellow-300 min-w-0 gap-2'>
              <span>{t('sections.ping.rarity', 'Rarity')}</span>
              <span className='font-mono font-semibold text-yellow-100 ml-2 text-right truncate max-w-[60%]'>
                +{earnings ? earnings.rarityPercent.toFixed(1) : 0}%
              </span>
            </div>
            <div className='flex justify-between items-center text-orange-300 min-w-0 gap-2'>
              <span>
                {earnings && earnings.streakPercent >= 0
                  ? t('sections.ping.streak', 'Streak')
                  : t('sections.ping.penalty', 'Penalty')}
              </span>
              <span className='font-mono font-semibold text-orange-100 ml-2 text-right truncate max-w-[60%]'>
                {earnings && earnings.streakPercent >= 0 ? '+' : ''}
                {earnings ? earnings.streakPercent.toFixed(1) : 0}%
              </span>
            </div>
            <div className='flex justify-between items-center text-amber-300 min-w-0 gap-2'>
              <span>{t('sections.ping.totalBonus', 'Total Bonus')}</span>
              <span className='font-mono font-semibold text-amber-100 ml-2 text-right truncate max-w-[60%]'>
                {earnings && earnings.bonusPercent >= 0 ? '+' : ''}
                {earnings ? earnings.bonusPercent.toFixed(1) : 0}%
              </span>
            </div>
            <div className='flex justify-between items-center text-emerald-300 font-semibold min-w-0 gap-2'>
              <span>24h</span>
              <span className='font-mono text-emerald-100 ml-2 text-right truncate max-w-[60%]'>
                {earnings ? formatCRADisplay(earnings.totalPerDay) : '...'}
              </span>
            </div>
            <div className='flex justify-between items-center text-lime-300 font-semibold min-w-0 gap-2'>
              <span>{t('sections.ping.pending', 'Pending')}</span>
              <span
                className={cn(
                  'font-mono ml-2 text-right truncate max-w-[60%]',
                  isActivated &&
                    parseFloat(
                      formatCRADisplay(displayPendingWei)
                    ) > 0
                    ? 'text-lime-300 font-bold bg-lime-900/30 px-1 rounded animate-pulse'
                    : isActivated
                    ? 'text-lime-200 animate-pulse'
                    : 'text-lime-100'
                )}
              >
                {earnings
                  ? formatCRADisplay(displayPendingWei)
                  : '0.00'}
              </span>
            </div>
            {/* Time accumulation info - show for all activated NFTs */}
            {isActivated && (
              <div className='flex justify-between items-center text-blue-300 text-[9px] min-w-0 gap-2'>
                <span>⏰ {t('sections.ping.accumulated', 'Accumulated')}</span>
                <span className='font-mono text-blue-100 ml-2 text-right truncate max-w-[60%]'>
                  {formatTimeAccumulation(timeSinceLastPing)}
                </span>
              </div>
            )}
            {/* Time until next ping - only show if not ready */}
            {!pingReady && (
              <div className='flex justify-between items-center text-orange-300 text-[9px] min-w-0 gap-2'>
                <span>⏳ {t('sections.ping.nextPing', 'Next Ping')}</span>
                <span className='font-mono text-orange-100 ml-2 text-right truncate max-w-[60%]'>
                  {formatTimeUntilPing(timeUntilNextPing)}
                </span>
              </div>
            )}
            <div className='flex justify-between items-center text-purple-300 font-semibold min-w-0 gap-2'>
              <span>{t('sections.ping.lockedCRAA', 'Locked CRAA')}</span>
              <span
                className={cn(
                  'font-mono ml-2 text-right truncate max-w-[60%]',
                  hasActiveCooldown && parseFloat(lockedCRAA.toString()) > 0
                    ? 'text-purple-300 font-bold bg-purple-900/30 px-1 rounded animate-pulse'
                    : 'text-purple-100'
                )}
              >
                {formatCRAA(lockedCRAA)}
              </span>
            </div>
            {/* Status line for ready NFTs to match cooldown NFT line count */}
            {pingReady && (
              <div className='flex justify-between items-center text-indigo-300 text-[9px] min-w-0 gap-2'>
                <span>{t('sections.ping.status', 'Status')}</span>
                <span className='font-mono text-indigo-100 ml-2 text-right truncate max-w-[60%]'>
                  {t('sections.ping.active', 'Active')}
                </span>
              </div>
            )}
            {/* Extra line for non-activated NFTs to keep card heights equal */}
            {!isActivated && (
              <div className='flex justify-between items-center text-gray-400 text-[9px] min-w-0 gap-2'>
                <span>&nbsp;</span>
                <span className='font-mono text-gray-300 ml-2 text-right truncate max-w-[60%]'>—</span>
              </div>
            )}
          </CardContent>

          {/* Ping button */}
          <div className='px-2 pb-2'>
            <CoinBurst key={String(nft.tokenId)} total={18} duration={0.8}>
              <Button
                variant={pingReady ? 'default' : 'outline'}
                size='sm'
                className={
                  pingReady
                    ? 'w-full h-7 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                    : 'w-full h-7 text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                }
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
                      ? t('sections.ping.button', 'Ping')
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
