'use client';

import React, { useState, useEffect } from 'react';

import { UnifiedNftCard } from './UnifiedNftCard';
import { Flame, Star, SatelliteDish } from 'lucide-react';
import { useCrazyOctagonGame, type NFTGameData } from '@/hooks/useCrazyOctagonGame';
import type { NftBatchItem } from '@/hooks/useContractBatch';
// performance context not needed in this component currently
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { parseEther, formatEther } from 'viem';
import { getColor, getLabel } from '@/lib/rarity';
import {
  computeStarState,
  getBaseStarsForRarity,
  getStarsFromIndex,
  normalizeStars,
  rarityIndexByLabel,
} from '@/lib/stars';
import { useTranslation } from 'react-i18next';
import { useChainId } from 'wagmi';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { NFT } from '@/types/nft';
import { useNetwork } from '@/hooks/use-network';
import { SECURITY_CONFIG, validateChainId, validateContractAddress } from '@/config/security';
import DOMPurify from 'isomorphic-dompurify';
import { BurnAnimationOverlay } from './BurnAnimationOverlay';
import { useBurnState } from '@/hooks/use-burn-state';

interface BurnCardProps {
  nft: NFT;
  index: number;
  onActionComplete?: () => void;
  batchedData?: NFTGameData | NftBatchItem | null | undefined; // Предзагруженные данные из батча
}

// Helper: format wei → OCTA human-readable
const fmtOCTA = (val: string | bigint | number) => {
  try {
    let valNumber: number;

    if (typeof val === 'string') {
      // If it's a string, treat it as OCTA (not wei)
      valNumber = parseFloat(val);
    } else if (typeof val === 'number') {
      valNumber = val;
    } else {
      // If it's bigint, convert to number (assuming it's in wei)
      valNumber = Number(formatEther(val));
    }

    if (!isFinite(valNumber) || valNumber < 0) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
      valNumber
    );
  } catch (error) {
    // Safe error handling for production
    if (process.env.NODE_ENV === 'development') {
      console.warn('fmtOCTA error:', error);
    }
    return '0';
  }
};

export const BurnCard = React.memo(function BurnCard({
  nft,
  index,
  batchedData,
}: BurnCardProps) {
  const { t } = useTranslation();
  const tokenId = String(nft.tokenId);
  // note: performance flags currently unused here
  const { incrementBurnCount, decrementBurnCount } = useBurnState();
  const {
    getNFTGameData,
    burnFeeBps,
    approveOCTA,
    approveNFT,
    burnNFT,
    isConnected,
    pingInterval,
    getBurnSplit,
    octaBalance,
    getLPInfo,
  } = useCrazyOctagonGame();
  const { toast } = useToast();
  const [data, setData] = useState<NFTGameData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // step state removed (was write-only); animationState drives UI
  const [waitMinutes, setWaitMinutes] = useState<30 | 120 | 480>(120);
  const [burnSplit, setBurnSplit] = useState<{
    playerBps: number;
    poolBps: number;
    burnBps: number;
  }>({ playerBps: 0, poolBps: 0, burnBps: 0 });
  const [animationState, setAnimationState] = useState<'idle' | 'approving' | 'burning' | 'exploding'>('idle');
  const [animationIntensity, setAnimationIntensity] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [charLevel, setCharLevel] = useState(0); // 0 = нет обугливания, 1-3 = уровни обугливания // Уровень интенсивности анимации
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lpInfo, setLpInfo] = useState<null | {
    lpAmount: string;
    lpAmountWei: bigint;
    octaDeposited: string;
    octaDepositedWei: bigint;
    pairDeposited: string;
    pairDepositedWei: bigint;
    helperAddress?: string;
    pairAddress?: string;
  }>(null);
  const { isApeChain, isMonadChain, requireMonadChain } = useNetwork();
  const chainId = useChainId();

  // Convert OCTA balance string to wei for comparisons
  const balWei = (() => {
    try {
      if (!octaBalance) return 0n;
      return parseEther(octaBalance);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid OCTA balance format:', octaBalance);
      }
      return 0n;
    }
  })();

  useEffect(() => {
    // If there's batched data, it may be either already parsed NFTGameData
    // or a wrapper from useNFTsBatchData: { tokenId, success, data, error }.
    // Normalize both shapes to NFTGameData to avoid passing a raw batch object
    // into the UI which causes lockedOcta to be undefined -> NaN/0 displays.
    if (batchedData) {
      if ('success' in batchedData) {
        if (batchedData.success && batchedData.data) {
          try {
            const summary = batchedData.data;
            const locked = (summary[9] as bigint) ?? 0n;
            const parsed: NFTGameData = {
              tokenId,
              rarity: Number(summary[3] as number | bigint) || 0,
              initialStars: 0,
              currentStars: Number(summary[4] as number | bigint) || 0,
              isActivated: Boolean(summary[2]),
              lockedOcta: formatEther(locked),
              lockedOctaWei: locked,
              lastPingTime: Number(summary[7] as number | bigint) || 0,
              lastBreedTime: Number(summary[8] as number | bigint) || 0,
              isInGraveyard: Boolean(summary[6]),
              bonusStars: Number(summary[5] as number | bigint) || 0,
            };
            setData(parsed);
          } catch (err) {
            // If parsing fails, fallback to individual RPC read
            if (process.env.NODE_ENV === 'development') console.warn('batch parse error', err);
            getNFTGameData(tokenId).then(setData);
          }
        } else {
          // Batch item failed or missing data — fallback to individual read
          getNFTGameData(tokenId).then(setData);
        }
      } else {
        // Already in expected shape
        setData(batchedData as NFTGameData);
      }
    } else {
      // Otherwise load individually (fallback)
      getNFTGameData(tokenId).then(setData);
    }
  // Note: getNFTGameData is stable from hook; intentionally omit from deps to avoid ref churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, batchedData]);

  // Derived ping status
  const nowSec = Math.floor(Date.now() / 1000);
  const pingReady = data
    ? data.lastPingTime === 0 || nowSec > data.lastPingTime + pingInterval
    : false;
  const pingTimeLeft = data
    ? Math.max(0, data.lastPingTime + pingInterval - nowSec)
    : 0;

  // fetch burn split when waitMinutes changes
  useEffect(() => {
    let ignore = false;
    getBurnSplit(waitMinutes).then(split => {
      if (!ignore) setBurnSplit(split);
    });
    return () => {
      ignore = true;
    };
  // getBurnSplit is stable; intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitMinutes]);

  // Автоматический сброс состояния после завершения анимации
  useEffect(() => {
    if (animationState === 'exploding') {
      const timer = setTimeout(() => {
        console.log('🔄 Resetting animation state to idle');
        setAnimationState('idle');
        setIsShaking(false);
        setCharLevel(0);
        setAnimationIntensity(1);
        // Карточка остаётся скрытой через isDisappearing
      }, 3000); // Даем время на взрыв и исчезновение
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [animationState]);

  // Проверка: если NFT в graveyard, скрываем карточку
  useEffect(() => {
    if (data?.isInGraveyard && !isDisappearing) {
      setIsDisappearing(true);
    }
  }, [data?.isInGraveyard, isDisappearing]);

  // Helper to calculate fee based on locked OCTA and burnFeeBps + additional fees
  const calcFee = () => {
    if (!data) return '0';
    try {
      const lockedWei = parseEther(data.lockedOcta);
      const baseFeeWei = (lockedWei * BigInt(burnFeeBps)) / BigInt(10000);
      const additionalFeeWei = (lockedWei * BigInt(50)) / BigInt(10000); // 0.5% = 50 bps
      const totalFeeWei = baseFeeWei + additionalFeeWei;

      // Convert to number for rounding, then back to wei
      const totalFeeNumber = Number(formatEther(totalFeeWei));
      const roundedFeeNumber = Math.ceil(totalFeeNumber * 100) / 100; // Round up to 2 decimal places
      const roundedFeeWei = parseEther(roundedFeeNumber.toString());

      return formatEther(roundedFeeWei); // Return without commas
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.warn('calcFeeDisplay error', err);
      return '0';
    }
  };

  // Helper to calculate fee for display (with commas)
  // calcFeeDisplay kept for backward compatibility with confirmation dialog
  const calcFeeDisplay = calcFee;

  const rarityKey = typeof nft.rarity === 'string' ? nft.rarity.toLowerCase() : '';
  const fallbackRarityIndex = rarityIndexByLabel[rarityKey] ?? 0;
  const fallbackStars = getStarsFromIndex(fallbackRarityIndex);
  const chainInitialStars = normalizeStars(data?.initialStars);
  const chainCurrentStars = normalizeStars(data?.currentStars);
  const chainBonusStars = normalizeStars(data?.bonusStars);
  const chainRarityStars = normalizeStars(data?.rarity);

  let baseStars = fallbackStars;
  if (chainRarityStars > 0) {
    baseStars = getBaseStarsForRarity(chainRarityStars);
  }
  if (chainInitialStars > 0) {
    baseStars = chainInitialStars;
  }

  let currentStarsRaw = baseStars;
  if (chainCurrentStars > 0) {
    currentStarsRaw = chainCurrentStars;
  } else if (typeof nft.stars === 'number' && nft.stars > 0) {
    currentStarsRaw = normalizeStars(nft.stars);
  }

  const bonusStars = chainBonusStars > 0
    ? chainBonusStars
    : Math.max(0, currentStarsRaw - baseStars);
  const starState = computeStarState({
    baseStars,
    bonusStars,
    currentStars: currentStarsRaw,
  });

  const widgets = [] as JSX.Element[];
  // OCTA badge
  if (data) {
    // Calculate user share for display
    // userShare intentionally unused here; keeping calcShares above

    // OCTA amount - show only locked OCTA (not pending)
    widgets.push(
      <Badge
        key='octa'
        className='bg-orange-600/80 text-xs font-mono min-w-[80px] text-center'
      >
        💰 {fmtOCTA(data.lockedOcta)} OCTAA
      </Badge>
    );

    widgets.push(
      <Badge
        key='stars'
        className='bg-black/40 text-yellow-200 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-yellow-500/30'
      >
        <Star className='w-3 h-3 text-yellow-300 fill-yellow-300' />
        <span>
          {starState.totalActive}/{starState.totalCapacity}
        </span>
        {starState.burnedBase > 0 && (
          <span className='text-red-300 font-semibold'>
            −{starState.burnedBase}
          </span>
        )}
        {starState.bonusSlots > 0 && (
          <span className='text-sky-300 font-semibold'>
            +{starState.activeBonus}/{starState.bonusSlots}
          </span>
        )}
      </Badge>
    );

    // Ping status badge
    widgets.push(
      <Badge
        key='ping'
        variant='secondary'
        className={`text-xs ${pingReady ? 'text-green-400' : 'text-gray-400'}`}
      >
        <SatelliteDish className='w-2 h-2 mr-0.5 inline' />{' '}
        {pingReady ? 'Ping ✓' : `${Math.ceil(pingTimeLeft / 60)}m`}
      </Badge>
    );
  }

    widgets.push(
      <Badge
        key='fee'
        variant='secondary'
        className='text-red-400/80 text-xs min-w-[120px] text-center'
      >
        <Flame className='w-2 h-2 mr-0.5 inline' /> <span className='text-black font-bold'>Fee</span>{' '}
        <span className='font-black text-black'>
          {data && Number(data.lockedOcta) > 0 ? calcFeeDisplay() : '0'} OCTAA
        </span>
      </Badge>
    );

  const calcShares = () => {
    if (!data) return { user: '0', pool: '0', burn: '0' };
  try {
      const totalWei = parseEther(data.lockedOcta);
      const userWei = (totalWei * BigInt(burnSplit.playerBps)) / BigInt(10000);
      const poolWei = (totalWei * BigInt(burnSplit.poolBps)) / BigInt(10000);
      const burnWei = (totalWei * BigInt(burnSplit.burnBps)) / BigInt(10000);
      return {
        user: fmtOCTA(userWei),
        pool: fmtOCTA(poolWei),
        burn: fmtOCTA(burnWei),
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.warn('calcShares error', err);
      return { user: '0', pool: '0', burn: '0' };
    }
  };

  const startBurn = async () => {
    if (!isConnected) {
      toast({
        title: t('wallet.notConnected', 'Wallet not connected'),
        description: t('wallet.connectFirst', 'Connect wallet first'),
        variant: 'destructive',
      });
      return;
    }
    if (!data) return;
    if (data.isInGraveyard) {
      toast({
        title: t('burn.alreadyBurned', 'Already burned'),
        description: t('burn.inGraveyard', 'This NFT is already in graveyard'),
        variant: 'destructive',
      });
      return;
    }

    // Check OCTA balance before proceeding
    const fee = calcFee();
    const feeWei = parseEther(fee);

    if (octaBalance && feeWei > balWei) {
      const balanceFormatted = formatEther(balWei);
      const feeFormatted = formatEther(feeWei);

      toast({
        title: t('burn.insufficientBalance', 'Insufficient OCTA Balance'),
        description: t(
          'burn.insufficientBalanceDesc',
          'You need {fee} OCTA to burn this NFT. Your balance: {balance} OCTA'
        )
          .replace('{fee}', feeFormatted)
          .replace('{balance}', balanceFormatted),
        variant: 'destructive',
      });
      return;
    }

    // Refresh data before showing dialog
    try {
      const freshData = await getNFTGameData(tokenId);
      setData(freshData);
      // Load LP info for this token to show in confirmation
      try {
        const lp = await getLPInfo(tokenId as string);
        if (lp) setLpInfo(lp);
      } catch {
        // ignore errors retrieving LP info
      }
      setDialogOpen(true);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.warn('startBurn refresh error', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Failed to prepare burn data';
      toast({
        title: t('status.error', 'Error'),
        description: DOMPurify.sanitize(message),
        variant: 'destructive',
      });
    }
  };

  const handleBurn = requireMonadChain(async () => {
    // DEBUG: Логирование состояния сети
    console.log('🔥 handleBurn started:', {
      chainId,
      isApeChain,
      isConnected,
      nftId: nft.tokenId,
      timestamp: new Date().toISOString()
    });

    if (!isConnected) {
      console.log('❌ Wallet not connected');
      toast({
        title: t('wallet.notConnected', 'Wallet not connected'),
        description: t('wallet.connectFirst', 'Connect wallet first'),
        variant: 'destructive',
      });
      return;
    }

    // CRITICAL: Validate chainId to prevent network spoofing
    if (!validateChainId(chainId)) {
      console.log('❌ Invalid chainId:', chainId);
      toast({
        title: t('wallet.wrongNetwork', 'Wrong Network'),
        description: t('wallet.switchToMonadChain', 'Please switch to Monad Testnet network'),
        variant: 'destructive',
      });
      return;
    }

    if (!data) return;
    if (data.isInGraveyard) {
      toast({
        title: t('burn.alreadyBurned', 'Already burned'),
        description: t('burn.inGraveyard', 'This NFT is already in graveyard'),
        variant: 'destructive',
      });
      return;
    }
    // CRITICAL: Validate contract addresses
    const expectedGameContract = SECURITY_CONFIG.CONTRACTS.GAME_CONTRACT;
    const expectedOCTAContract = SECURITY_CONFIG.CONTRACTS.OCTA_TOKEN;

    if (!validateContractAddress(expectedGameContract)) {
      toast({
        title: 'Security Error',
        description: 'Invalid game contract address',
        variant: 'destructive',
      });
      return;
    }

    if (!validateContractAddress(expectedOCTAContract)) {
      toast({
        title: 'Security Error',
        description: 'Invalid OCTA token address',
        variant: 'destructive',
      });
      return;
    }

    // Check OCTA balance before proceeding
    const fee = calcFee();
    const feeWei = parseEther(fee);

    if (octaBalance && feeWei > balWei) {
      const balanceFormatted = formatEther(balWei);
      const feeFormatted = formatEther(feeWei);

      toast({
        title: t('burn.insufficientBalance', 'Insufficient OCTA Balance'),
        description: t(
          'burn.insufficientBalanceDesc',
          'You need {fee} OCTA to burn this NFT. Your balance: {balance} OCTA'
        )
          .replace('{fee}', feeFormatted)
          .replace('{balance}', balanceFormatted),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      incrementBurnCount(); // Увеличиваем счетчик активных сжиганий
      console.log('🔥 Starting burn animation - approving phase');
      setAnimationState('approving');
      setAnimationIntensity(1); // Первый уровень интенсивности
      setIsShaking(true);
      setCharLevel(1); // Начальное обугливание
      
      // CRITICAL: Show exact amount being approved to prevent approve-∞ attacks
      const approvalAmount = fee.replace(/,/g, '');
      toast({ 
        title: 'Approving OCTA', 
        description: `Amount: ${approvalAmount} OCTA (NOT unlimited)`,
        variant: 'default',
      });
      
      await approveOCTA(approvalAmount);
      
      // Переходим ко второму этапу анимации
      console.log('🔥 Animation phase 2 - NFT approval');
      setAnimationState('approving'); // Продолжаем анимацию
      setAnimationIntensity(2); // Второй уровень интенсивности
      setCharLevel(2); // Усиливаем обугливание
      toast({ 
        title: 'Approving NFT', 
        description: `Token #${tokenId} (specific token only)`,
        variant: 'default',
      });
      await approveNFT(tokenId);
      
      // Переходим к финальному этапу анимации
      console.log('🔥 Animation phase 3 - BURNING!');
      setAnimationState('burning');
      setAnimationIntensity(3); // Третий уровень интенсивности
      setCharLevel(3); // Максимальное обугливание
      
      // Усиливаем дрожание перед взрывом
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => setIsShaking(true), 600);
      setTimeout(() => setIsShaking(false), 700);
      setTimeout(() => setIsShaking(true), 800);
      toast({ 
        title: 'Burning NFT', 
        description: `Token #${tokenId}`,
        variant: 'default',
      });
      
      await burnNFT(tokenId, waitMinutes);

      console.log('💥 Animation phase 4 - EXPLODING!');
        setAnimationState('exploding');
        setAnimationIntensity(5); // Максимальная интенсивность для взрыва
      toast({
        title: 'NFT burned!',
        description: `Sent to graveyard. Claim after ${waitMinutes} minutes`,
      });
      
      // Wait for explosion to finish
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Запускаем эффект исчезновения
      setIsDisappearing(true);
      
      // Ждем завершения эффекта исчезновения
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Локальное обновление данных без вызова onActionComplete для сохранения анимаций
      // if (onActionComplete) onActionComplete(); // Убрано для предотвращения обновления страницы
      const updated = await getNFTGameData(tokenId);
      setData(updated);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Failed to burn NFT';
      toast({
        title: 'Error',
        description: DOMPurify.sanitize(message),
        variant: 'destructive',
      });
      setAnimationState('idle'); // Reset animation on error
      setAnimationIntensity(1); // Reset intensity on error
      setIsDisappearing(false); // Reset disappearing effect on error
      setIsShaking(false);
      setCharLevel(0);
      decrementBurnCount(); // Уменьшаем счетчик при ошибке
    } finally {
      setIsProcessing(false);
      decrementBurnCount(); // Уменьшаем счетчик в любом случае
      // Не сбрасываем step сразу - пусть анимация завершится
      console.log('🏁 Burn process completed, animation should continue');
    }
  });

  // Если карточка исчезла полностью, не рен��ерим её
  if (isDisappearing && animationState === 'idle') {
    return null;
  }

  return (
    <>
      <div
        className={`relative flex flex-col h-full min-h-[420px] rounded-xl overflow-hidden transition-all duration-[5000ms] ${
          isDisappearing 
            ? 'opacity-0 scale-50 transform rotate-[360deg] blur-lg pointer-events-none' 
            : 'opacity-100 scale-100 transform rotate-0 blur-0'
        } ${
          isShaking ? 'animate-shake' : ''
        } ${
          charLevel === 1 ? 'char-level-1' : 
          charLevel === 2 ? 'char-level-2' : 
          charLevel === 3 ? 'char-level-3' : ''
        }`}
        style={{
          filter: charLevel > 0 ? `
            brightness(${1 - charLevel * 0.2}) 
            contrast(${1 + charLevel * 0.3}) 
            sepia(${charLevel * 0.4})
            hue-rotate(${charLevel * 20}deg)
            saturate(${1 - charLevel * 0.2})
          ` : 'none',
          transformOrigin: 'center center'
        }}
      >
        <div className='flex-1 flex flex-col justify-between'>
          {/* NFT visual layer */}
          <div
            className={`${data && Number(data.lockedOcta) === 0 ? 'opacity-30 grayscale pointer-events-none' : ''}`}
          >
            <UnifiedNftCard
              imageSrc={nft.image}
              tokenId={tokenId}
              title={nft.name || `CrazyCube #${tokenId}`}
              rarityLabel={
                data?.rarity ? getLabel(data.rarity) || 'Common' : 'Common'
              }
              rarityColorClass={`${data ? getColor(data.rarity) : 'bg-gray-500'} text-white`}
              widgets={widgets}
              delay={index * 0.05}
            />
          </div>

          <BurnAnimationOverlay step={animationState} intensity={animationIntensity} />

          {/* Wait period selector */}
          <div className='flex justify-center gap-1 mt-2'>
            {[30, 120, 480].map(m => (
              <Button
                key={m}
                variant={waitMinutes === m ? 'default' : 'outline'}
                size='sm'
                className='px-2 py-1'
                onClick={() => setWaitMinutes(m as 30 | 120 | 480)}
                disabled={isProcessing}
              >
                {m}
              </Button>
            ))}
          </div>

          {/* Share breakdown */}
          {data && (
            <div className='mt-1 bg-black/90 border border-orange-500/40 rounded-md p-2 text-[11px] leading-tight space-y-1 shadow-md shadow-black/50'>
              {(() => {
                const s = calcShares();
                return (
                  <>
                    <div className='flex justify-between'>
                      <span>
                        {t('burn.interface.balanceDetails.you', '👤 You')}
                      </span>
                      <span className='font-semibold text-green-300 font-mono text-sm'>
                        {s.user}
                      </span>
                    </div>
                    <div className='flex justify-between text-orange-300'>
                      <span>
                        {t('burn.interface.balanceDetails.pool', '🏦 Pool')}
                      </span>
                      <span className='font-semibold font-mono text-sm'>
                        {s.pool}
                      </span>
                    </div>
                    <div className='flex justify-between text-red-400'>
                      <span>
                        {t('burn.interface.balanceDetails.burn', '🔥 Burn')}
                      </span>
                      <span className='font-semibold font-mono text-sm'>
                        {s.burn}
                      </span>
                    </div>
                    <div className='text-center text-gray-400/70 pt-0.5 text-[10px]'>
                      {t(
                        `burn.interface.balanceDetails.split${waitMinutes}min`,
                        `${burnSplit.playerBps / 100}% / ${burnSplit.poolBps / 100}% / ${burnSplit.burnBps / 100}%`
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        <div className='mt-auto w-full'>
          <Button
            size='sm'
            className={
              data && Number(data.lockedOcta) === 0
                ? 'w-full bg-gray-400 text-gray-700 cursor-not-allowed'
                : octaBalance &&
                    data &&
                    (() => {
                      try {
                        return parseEther(calcFee()) > balWei;
                      } catch {
                        return false;
                      }
                    })()
                  ? 'w-full bg-red-400 text-white cursor-not-allowed'
                  : 'w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white'
            }
            disabled={
              !isMonadChain ||
              isProcessing ||
              !!data?.isInGraveyard ||
              (!!data && Number(data.lockedOcta) === 0) ||
              (octaBalance &&
                data &&
                (() => {
                  try {
                    const feeWei = parseEther(calcFee());
                    return feeWei > balWei;
                  } catch {
                    return false;
                  }
                })()) === true
            }
            onClick={startBurn}
          >
            {octaBalance &&
            data &&
            (() => {
              try {
                const feeWei = parseEther(calcFee());
                return feeWei > balWei;
              } catch {
                return false;
              }
            })()
              ? t('burn.interface.insufficientOCTA', 'Insufficient OCTA')
              : t('burn.interface.burnButton', 'Burn')}
          </Button>
        </div>
      </div>
      {/* Confirmation dialog */}
      {data && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className='bg-[#2f2b2b]/95 border border-red-500/30 text-gray-100 max-w-md text-[15px]'>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center text-red-300 text-lg'>
                <Flame className='w-5 h-5 mr-2' /> {t('sections.burn.feeBox.confirmDialog.title', `Burn NFT #${tokenId}`).replace('{tokenId}', tokenId)}
              </AlertDialogTitle>
              
              {/* NFT Earnings Display */}
              {data.lockedOcta && Number(data.lockedOcta) > 0 && (
                <div className='bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-400/50 rounded-lg p-4 mb-4 text-center'>
                  <div className='text-2xl font-bold text-orange-200 mb-1'>
                    {t('sections.burn.feeBox.confirmDialog.nftEarnings', '🎉 NFT Earnings')}
                  </div>
                  <div className='text-3xl font-bold text-yellow-300 mb-2'>
                    {fmtOCTA(data.lockedOcta)} OCTAA
                  </div>
                  <div className='text-sm text-orange-200'>
                    {t('sections.burn.feeBox.confirmDialog.totalLockedAmount', 'Total locked amount earned by this NFT')}
                  </div>
                </div>
              )}
              
              <div className='space-y-2 text-orange-50'>
                <div className='bg-yellow-900/30 border border-yellow-500/50 rounded-md p-3 mb-3'>
                  <div className='text-yellow-200 font-semibold mb-1'>
                    {t('sections.burn.feeBox.confirmDialog.warning', '⚠️ IMPORTANT: This action is irreversible!')}
                  </div>
                  <div className='text-yellow-100 text-sm'>
                    {t('sections.burn.feeBox.confirmDialog.description', 'Your NFT will be permanently burned and sent to graveyard.')}
                  </div>
                </div>
                <div>
                  {t('sections.burn.feeBox.confirmDialog.waitPeriod', 'Wait period:')}{' '}
                  <span className='font-medium text-orange-300'>
                    {waitMinutes} {t('sections.burn.feeBox.confirmDialog.minutes', 'minutes')}
                  </span>
                </div>
                <div>
                  {t('sections.burn.feeBox.confirmDialog.lockedOCTA', 'Locked OCTAA:')}{' '}
                  <span className='font-mono text-yellow-300'>
                    {data.lockedOcta && Number(data.lockedOcta) > 0
                      ? fmtOCTA(data.lockedOcta)
                      : '0'}{' '}
                    OCTAA
                  </span>
                </div>
                <div>
                  {t('sections.burn.feeBox.confirmDialog.fee', 'Fee:')}{' '}
                  <span className='font-mono text-red-300'>
                    {calcFee()} OCTAA
                  </span>
                </div>
                {(() => {
                  const s = calcShares();
                  return (
                    <div className='pt-1 text-xs text-gray-300 space-y-0.5'>
                      <div className='bg-gray-800/60 border border-green-400/40 rounded-md px-2 py-1 flex justify-between items-center text-base font-semibold text-green-200'>
                          <span className='text-lg'>{t('sections.burn.feeBox.confirmDialog.afterBurn', 'After burn you get')}</span>
                          <span className='font-mono text-3xl font-extrabold text-green-300 animate-reward-pulse'>{s.user} OCTAA</span>
                      </div>
                        {lpInfo && (
                          <div className='mt-2 bg-black/60 border border-blue-400/30 rounded-md p-3 text-sm text-blue-200'>
                            <div className='font-semibold text-blue-100'>LP returned</div>
                            {/* Emphasize player-received pair token (e.g., WMON) clearly */}
                            <div className='mt-2 bg-blue-900/20 border border-blue-500/40 rounded-md p-3 text-center'>
                              <div className='text-sm text-blue-200'>Player receives</div>
                              <div className='text-2xl font-extrabold text-white font-mono mt-1'>
                                {lpInfo.pairDeposited} WMON
                              </div>
                            </div>
                          </div>
                        )}
                      <div>
                        {t('sections.burn.feeBox.confirmDialog.poolReceives', 'Pool receives:')}{' '}
                        <span className='text-orange-300 font-mono'>
                          {s.pool}
                        </span>
                      </div>
                      <div>
                        {t('sections.burn.feeBox.confirmDialog.burnedForever', 'Burned forever:')}{' '}
                        <span className='text-red-400 font-mono'>
                          {s.burn} OCTAA
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className='pt-2 text-xs text-gray-400'>
                  {t('sections.burn.feeBox.confirmDialog.transactions', 'You will sign 3 transactions:')}
                  <br />
                  {t('sections.burn.feeBox.confirmDialog.transaction1', '1️⃣ Approve OCTAA fee')} • {t('sections.burn.feeBox.confirmDialog.transaction2', '2️⃣ Approve NFT')} • {t('sections.burn.feeBox.confirmDialog.transaction3', '3️⃣ Burn NFT')}
                </div>
                {octaBalance && (
                  <div className='pt-2 text-xs text-gray-300'>
                    {t('sections.burn.feeBox.confirmDialog.yourBalance', 'Your OCTAA balance:')} {formatEther(balWei)} OCTAA
                  </div>
                )}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('sections.burn.feeBox.confirmDialog.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDialogOpen(false);
                  handleBurn();
                }}
              >
                {t('sections.burn.feeBox.confirmDialog.confirm', 'Confirm Burn')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
});








