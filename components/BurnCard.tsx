import { useState, useEffect } from 'react';
import { UnifiedNftCard } from './UnifiedNftCard';
import { Flame, Star, Loader2, SatelliteDish } from 'lucide-react';
import { useCrazyCubeGame, type NFTGameData } from '@/hooks/useCrazyCubeGame';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { parseEther, formatEther } from 'viem';
import { getColor, getLabel } from '@/lib/rarity';
import { useTranslation } from 'react-i18next';
import { useChainId } from 'wagmi';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { NFT } from '@/types/nft';
import { useNetwork } from '@/hooks/use-network';
import React from 'react';
import { useMobile } from '@/hooks/use-mobile';
import { SECURITY_CONFIG, validateChainId, validateContractAddress } from '@/config/security';
import DOMPurify from 'isomorphic-dompurify';

interface BurnCardProps {
  nft: NFT;
  index: number;
  onActionComplete?: () => void;
}

// Helper: format wei → CRAA human-readable
const fmtCRAA = (val: string | bigint | number) => {
  try {
    let valNumber: number;

    if (typeof val === 'string') {
      // If it's a string, treat it as CRAA (not wei)
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
      console.warn('fmtCRAA error:', error);
    }
    return '0';
  }
};

export const BurnCard = React.memo(function BurnCard({
  nft,
  index,
  onActionComplete,
}: BurnCardProps) {
  const { t } = useTranslation();
  const tokenId = String(nft.tokenId);
  const { isLiteMode } = usePerformanceContext();
  const {
    getNFTGameData,
    burnFeeBps,
    approveCRAA,
    approveNFT,
    burnNFT,
    isConnected,
    pingInterval,
    getBurnSplit,
    craaBalance,
  } = useCrazyCubeGame();
  const { toast } = useToast();
  const [data, setData] = useState<NFTGameData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<
    'idle' | 'approvingCRAA' | 'approvingNFT' | 'burning'
  >('idle');
  const [waitMinutes, setWaitMinutes] = useState<12 | 60 | 255>(12);
  const [burnSplit, setBurnSplit] = useState<{
    playerBps: number;
    poolBps: number;
    burnBps: number;
  }>({ playerBps: 0, poolBps: 0, burnBps: 0 });
  const [burnFX, setBurnFX] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isApeChain, requireApeChain } = useNetwork();
  const { isMobile } = useMobile();
  const chainId = useChainId();

  // Convert string balance to wei safely
  const balWei = (() => {
    try {
      if (!craaBalance) return 0n;
      return parseEther(String(craaBalance)); // "9 999 915 222 398" → wei
    } catch (error) {
      // CRITICAL: Safe error handling to prevent DoS
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid balance format:', craaBalance);
      }
      return 0n;
    }
  })();

  useEffect(() => {
    getNFTGameData(tokenId).then(setData);
  }, [tokenId]);

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
  }, [waitMinutes]);

  // Helper to calculate fee based on locked CRAA and burnFeeBps + additional fees
  const calcFee = () => {
    if (!data) return '0';
    try {
      const lockedWei = parseEther(data.lockedCRAA);
      const baseFeeWei = (lockedWei * BigInt(burnFeeBps)) / BigInt(10000);
      const additionalFeeWei = (lockedWei * BigInt(50)) / BigInt(10000); // 0.5% = 50 bps
      const totalFeeWei = baseFeeWei + additionalFeeWei;

      // Convert to number for rounding, then back to wei
      const totalFeeNumber = Number(formatEther(totalFeeWei));
      const roundedFeeNumber = Math.ceil(totalFeeNumber * 100) / 100; // Round up to 2 decimal places
      const roundedFeeWei = parseEther(roundedFeeNumber.toString());

      return formatEther(roundedFeeWei); // Return without commas
    } catch (error) {
      return '0';
    }
  };

  // Helper to calculate fee for display (with commas)
  const calcFeeDisplay = () => {
    if (!data) return '0';
    try {
      const lockedWei = parseEther(data.lockedCRAA);
      const baseFeeWei = (lockedWei * BigInt(burnFeeBps)) / BigInt(10000);
      const additionalFeeWei = (lockedWei * BigInt(50)) / BigInt(10000); // 0.5% = 50 bps
      const totalFeeWei = baseFeeWei + additionalFeeWei;

      // Convert to number for rounding, then back to wei
      const totalFeeNumber = Number(formatEther(totalFeeWei));
      const roundedFeeNumber = Math.ceil(totalFeeNumber * 100) / 100; // Round up to 2 decimal places
      const roundedFeeWei = parseEther(roundedFeeNumber.toString());

      return fmtCRAA(roundedFeeWei); // Return with commas for display
    } catch (error) {
      return '0';
    }
  };

  const widgets = [] as JSX.Element[];
  // CRAA badge
  if (data) {
    // Calculate user share for display
    const userShare = (() => {
      if (!data.lockedCRAA || Number(data.lockedCRAA) === 0) return '0';
      try {
        const totalWei = parseEther(data.lockedCRAA);
        const userWei =
          (totalWei * BigInt(burnSplit.playerBps)) / BigInt(10000);
        return fmtCRAA(userWei);
      } catch (error) {
        return '0';
      }
    })();

    // CRAA amount - show only locked CRAA (not pending)
    widgets.push(
      <Badge
        key='craa'
        className='bg-orange-600/80 text-xs font-mono min-w-[80px] text-center'
      >
        💰 {fmtCRAA(data.lockedCRAA)} CRAA
      </Badge>
    );

    // Debug info (temporary)
    // Stars row (filled / empty)
    widgets.push(
      <span key='stars' className='flex space-x-0.5'>
        {Array.from({ length: data.initialStars }).map((_, idx) => (
          <Star
            key={idx}
            className={`w-2 h-2 ${idx < data.currentStars ? 'text-yellow-400 fill-current' : 'text-gray-600'} `}
          />
        ))}
      </span>
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
      <Flame className='w-2 h-2 mr-0.5 inline' /> Fee{' '}
      {data && Number(data.lockedCRAA) > 0 ? calcFeeDisplay() : '0'} CRAA
    </Badge>
  );

  const calcShares = () => {
    if (!data) return { user: '0', pool: '0', burn: '0' };
    try {
      const totalWei = parseEther(data.lockedCRAA);
      const userWei = (totalWei * BigInt(burnSplit.playerBps)) / BigInt(10000);
      const poolWei = (totalWei * BigInt(burnSplit.poolBps)) / BigInt(10000);
      const burnWei = (totalWei * BigInt(burnSplit.burnBps)) / BigInt(10000);
      return {
        user: fmtCRAA(userWei),
        pool: fmtCRAA(poolWei),
        burn: fmtCRAA(burnWei),
      };
    } catch (error) {
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

    // Check CRAA balance before proceeding
    const fee = calcFee();
    const feeWei = parseEther(fee);

    if (craaBalance && feeWei > balWei) {
      const balanceFormatted = formatEther(balWei);
      const feeFormatted = formatEther(feeWei);

      toast({
        title: t('burn.insufficientBalance', 'Insufficient CRAA Balance'),
        description: t(
          'burn.insufficientBalanceDesc',
          'You need {fee} CRAA to burn this NFT. Your balance: {balance} CRAA'
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
    } catch (error) {}

    setDialogOpen(true);
  };

  const handleBurn = requireApeChain(async () => {
    if (!isConnected) {
      toast({
        title: t('wallet.notConnected', 'Wallet not connected'),
        description: t('wallet.connectFirst', 'Connect wallet first'),
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
    const expectedCRAAContract = SECURITY_CONFIG.CONTRACTS.CRAA_TOKEN;
    
    if (!validateContractAddress(expectedGameContract)) {
      toast({
        title: 'Security Error',
        description: 'Invalid game contract address',
        variant: 'destructive',
      });
      return;
    }
    
    // Check CRAA balance before proceeding
    const fee = calcFee();
    const feeWei = parseEther(fee);

    if (craaBalance && feeWei > balWei) {
      const balanceFormatted = formatEther(balWei);
      const feeFormatted = formatEther(feeWei);

      toast({
        title: t('burn.insufficientBalance', 'Insufficient CRAA Balance'),
        description: t(
          'burn.insufficientBalanceDesc',
          'You need {fee} CRAA to burn this NFT. Your balance: {balance} CRAA'
        )
          .replace('{fee}', feeFormatted)
          .replace('{balance}', balanceFormatted),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setStep('approvingCRAA');
      
      // CRITICAL: Show exact amount being approved to prevent approve-∞ attacks
      const approvalAmount = fee.replace(/,/g, '');
      toast({ 
        title: 'Approving CRAA', 
        description: `Amount: ${approvalAmount} CRAA (NOT unlimited)`,
        variant: 'default',
      });
      
      await approveCRAA(approvalAmount);
      setStep('approvingNFT');
      toast({ 
        title: 'Approving NFT', 
        description: `Token #${tokenId} (specific token only)`,
        variant: 'default',
      });
      await approveNFT(tokenId);
      setStep('burning');
      toast({ 
        title: 'Burning NFT', 
        description: `Token #${tokenId}`,
        variant: 'default',
      });
      setBurnFX(true);
      setTimeout(() => setBurnFX(false), 3000);
      await burnNFT(tokenId, waitMinutes);
      toast({
        title: 'NFT burned',
        description: `Sent to graveyard. Claim after ${waitMinutes} minutes`,
      });
      if (onActionComplete) onActionComplete();
      const updated = await getNFTGameData(tokenId);
      setData(updated);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? DOMPurify.sanitize(error.message) : 'Failed to burn NFT';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setStep('idle');
    }
  });

  return (
    <>
      <div
        className='flex flex-col h-full min-h-[420px]'
      >
        <div className='flex-1 flex flex-col justify-between'>
          {/* NFT visual layer */}
          <div
            className={`${data && Number(data.lockedCRAA) === 0 ? 'opacity-30 grayscale pointer-events-none' : ''}`}
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

          {/* burn overlay */}
          {burnFX && (
            <div className='absolute inset-0 burn-overlay pointer-events-none rounded-lg' />
          )}

          {/* Wait period selector */}
          <div className='flex justify-center gap-1 mt-2'>
            {[12, 60, 255].map(m => (
              <Button
                key={m}
                variant={waitMinutes === m ? 'default' : 'outline'}
                size='sm'
                className='px-2 py-1'
                onClick={() => setWaitMinutes(m as 12 | 60 | 255)}
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
              data && Number(data.lockedCRAA) === 0
                ? 'w-full bg-gray-400 text-gray-700 cursor-not-allowed'
                : craaBalance &&
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
              !isApeChain ||
              isProcessing ||
              !!data?.isInGraveyard ||
              (!!data && Number(data.lockedCRAA) === 0) ||
              (craaBalance &&
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
            {craaBalance &&
            data &&
            (() => {
              try {
                const feeWei = parseEther(calcFee());
                return feeWei > balWei;
              } catch {
                return false;
              }
            })()
              ? t('burn.interface.insufficientCRAA', 'Insufficient CRAA')
              : t('burn.interface.burnButton', 'Burn')}
          </Button>
        </div>
      </div>
      {/* Global burn animation style & keyframes */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <style jsx global>{`
        @keyframes burnFade {
          0% {
            opacity: 0;
            filter: brightness(2) saturate(1.5);
          }
          10% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: scale(0.8) rotate(2deg);
          }
        }
        .burn-overlay {
          background: radial-gradient(
            circle at center,
            rgba(255, 200, 0, 0.6) 0%,
            rgba(255, 0, 0, 0.5) 40%,
            transparent 80%
          );
          animation: burnFade 2.4s forwards ease-out;
        }
      `}</style>
      {/* Confirmation dialog */}
      {data && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className='bg-[#2f2b2b]/95 border border-red-500/30 text-gray-100 max-w-md text-[15px]'>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center text-red-300 text-lg'>
                <Flame className='w-5 h-5 mr-2' /> {t('sections.burn.feeBox.confirmDialog.title', `Burn NFT #${tokenId}`).replace('{tokenId}', tokenId)}
              </AlertDialogTitle>
              
              {/* NFT Earnings Display */}
              {data.lockedCRAA && Number(data.lockedCRAA) > 0 && (
                <div className='bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-400/50 rounded-lg p-4 mb-4 text-center'>
                  <div className='text-2xl font-bold text-orange-200 mb-1'>
                    {t('sections.burn.feeBox.confirmDialog.nftEarnings', '🎉 NFT Earnings')}
                  </div>
                  <div className='text-3xl font-bold text-yellow-300 mb-2'>
                    {fmtCRAA(data.lockedCRAA)} CRAA
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
                  {t('sections.burn.feeBox.confirmDialog.lockedCRAA', 'Locked CRAA:')}{' '}
                  <span className='font-mono text-yellow-300'>
                    {data.lockedCRAA && Number(data.lockedCRAA) > 0
                      ? fmtCRAA(data.lockedCRAA)
                      : '0'}{' '}
                    CRAA
                  </span>
                </div>
                <div>
                  {t('sections.burn.feeBox.confirmDialog.fee', 'Fee:')}{' '}
                  <span className='font-mono text-red-300'>
                    {calcFee()} CRAA
                  </span>
                </div>
                {(() => {
                  const s = calcShares();
                  return (
                    <div className='pt-1 text-xs text-gray-300 space-y-0.5'>
                      <div className='bg-gray-800/60 border border-green-400/40 rounded-md px-2 py-1 flex justify-between items-center text-base font-semibold text-green-200'>
                        <span>{t('sections.burn.feeBox.confirmDialog.afterBurn', 'After burn you get')}</span>
                        <span className='font-mono'>{s.user}</span>
                      </div>
                      <div>
                        {t('sections.burn.feeBox.confirmDialog.poolReceives', 'Pool receives:')}{' '}
                        <span className='text-orange-300 font-mono'>
                          {s.pool}
                        </span>
                      </div>
                      <div>
                        {t('sections.burn.feeBox.confirmDialog.burnedForever', 'Burned forever:')}{' '}
                        <span className='text-red-400 font-mono'>
                          {s.burn} CRAA
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className='pt-2 text-xs text-gray-400'>
                  {t('sections.burn.feeBox.confirmDialog.transactions', 'You will sign 3 transactions:')}
                  <br />
                  {t('sections.burn.feeBox.confirmDialog.transaction1', '1️⃣ Approve CRAA fee')} • {t('sections.burn.feeBox.confirmDialog.transaction2', '2️⃣ Approve NFT')} • {t('sections.burn.feeBox.confirmDialog.transaction3', '3️⃣ Burn NFT')}
                </div>
                {craaBalance && (
                  <div className='pt-2 text-xs text-gray-300'>
                    {t('sections.burn.feeBox.confirmDialog.yourBalance', 'Your CRAA balance:')} {formatEther(balWei)} CRAA
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
