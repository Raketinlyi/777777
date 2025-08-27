import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Star,
  Zap,
  Clock,
  Loader2,
  SatelliteDish,
  Heart,
} from 'lucide-react';
import Image from 'next/image';
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

import {
  AlchemyNFT,
  getNFTImage,
  getTokenIdAsDecimal,
} from '@/hooks/useUserNFTs';
import { useCrazyCubeGame, type NFTGameData } from '@/hooks/useCrazyCubeGame';
import { useToast } from '@/hooks/use-toast';
import { formatEther, parseEther } from 'viem';
import { getColor, getLabel } from '@/lib/rarity';
import { BurnEffect } from '@/components/burn-effect';
import { useTranslation } from 'react-i18next';
import CardBurnOverlay from '@/components/card-burn-overlay';

interface NFTBurnCardProps {
  nft: AlchemyNFT;
  index: number;
  onActionComplete?: () => void;
}

export default function NFTBurnCard({
  nft,
  index,
  onActionComplete,
}: NFTBurnCardProps) {
  const { t } = useTranslation();
  const tokenIdDecimal = getTokenIdAsDecimal(nft);
  const {
    getNFTGameData,
    burnFeeBps,
    approveCRAA,
    approveNFT,
    burnNFT,
    isConnected,
    getBurnSplit,
    pingInterval,
    breedCooldown,
  } = useCrazyCubeGame();

  const { toast } = useToast();

  const [gameData, setGameData] = useState<NFTGameData | null>(null);
  const [selected, setSelected] = useState(false);
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
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch game data on mount and when tokenId changes
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      const data = await getNFTGameData(tokenIdDecimal);
      if (!ignore) setGameData(data);
    };
    fetchData();
    // fetch burn split for current waitMinutes
    const fetchSplit = async () => {
      const split = await getBurnSplit(waitMinutes);
      if (!ignore) setBurnSplit(split);
    };
    fetchSplit();
    return () => {
      ignore = true;
    };
  }, [tokenIdDecimal, waitMinutes]);

  // Helpers
  const rarityInfo = (r: number) => ({ color: getColor(r), text: getLabel(r) });

  const calcFee = (): string => {
    if (!gameData) return '0';
    const lockedWei = parseEther(gameData.lockedCRAA);
    const feeWei = (lockedWei * BigInt(burnFeeBps)) / BigInt(10000);
    return formatEther(feeWei);
  };

  const calcShares = () => {
    if (!gameData) return { user: '0', pool: '0', burn: '0' };
    const totalWei = parseEther(gameData.lockedCRAA);
    const userWei = (totalWei * BigInt(burnSplit.playerBps)) / BigInt(10000);
    const poolWei = (totalWei * BigInt(burnSplit.poolBps)) / BigInt(10000);
    const burnWei = (totalWei * BigInt(burnSplit.burnBps)) / BigInt(10000);
    return {
      user: formatEther(userWei),
      pool: formatEther(poolWei),
      burn: formatEther(burnWei),
    };
  };

  const handleBurn = async () => {
    if (!isConnected) {
      toast({
        title: t('wallet.notConnected', 'Wallet not connected'),
        description: t('wallet.connectFirst', 'Connect wallet first'),
        variant: 'destructive',
      });
      return;
    }
    if (!gameData) return;
    if (gameData.isInGraveyard) {
      toast({
        title: 'Already burned',
        description: 'This NFT is already in graveyard',
        variant: 'destructive',
      });
      return;
    }

    setDialogOpen(true);
  };

  const confirmBurn = async () => {
    if (!gameData) return;

    const fee = calcFee();

    try {
      setIsProcessing(true);
      setStep('approvingCRAA');
      toast({ title: 'Approving CRAA', description: `Fee: ${fee} CRAA` });
      await approveCRAA(fee);

      setStep('approvingNFT');
      toast({
        title: 'Approving NFT',
        description: `Token #${tokenIdDecimal}`,
      });
      await approveNFT(tokenIdDecimal);

      setStep('burning');
      toast({ title: 'Burning NFT', description: `Token #${tokenIdDecimal}` });
      await burnNFT(tokenIdDecimal, waitMinutes);

      toast({
        title: 'NFT burned',
        description: `Sent to graveyard. Claim after ${waitMinutes} minutes`,
      });

      setSelected(false);
      // Refetch data after burn
      const updated = await getNFTGameData(tokenIdDecimal);
      setGameData(updated);
      if (onActionComplete) onActionComplete();
    } catch (error: any) {
      toast({
        title: t('burn.error', 'Error'),
        description: error?.message || t('burn.failed', 'Failed to burn NFT'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setStep('idle');
    }
  };

  // format duration helper (seconds -> h m s)
  const formatDuration = (totalSec: number): string => {
    if (totalSec <= 0) return '0s';
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    let out = '';
    if (d) out += `${d}d `;
    if (h) out += `${h}h `;
    if (m) out += `${m}m `;
    if (s && !d && !h) out += `${s}s`;
    return out.trim();
  };

  // Derived statuses
  const nowSec = Math.floor(Date.now() / 1000);
  const pingReady = gameData
    ? gameData.lastPingTime === 0 ||
      nowSec > gameData.lastPingTime + pingInterval
    : false;
  const pingTimeLeft = gameData
    ? Math.max(0, gameData.lastPingTime + pingInterval - nowSec)
    : 0;

  const breedReady = gameData
    ? gameData.currentStars > 0 &&
      nowSec > gameData.lastBreedTime + breedCooldown
    : false;
  const breedTimeLeft = gameData
    ? Math.max(0, gameData.lastBreedTime + breedCooldown - nowSec)
    : 0;

  const noCRAA = gameData ? Number(gameData.lockedCRAA) === 0 : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className='group scale-[0.75]'
    >
      {/* Show global burn overlay while the NFT is being burned */}
      {step === 'burning' && (
        <BurnEffect
          isActive
          onComplete={() => {
            /* overlay hides itself after animation */
          }}
        />
      )}
      <Card
        className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-2 transition-all duration-300 hover:scale-105 ${
          selected
            ? 'border-orange-500 shadow-lg shadow-orange-500/25'
            : 'border-slate-700 hover:border-orange-500/50'
        } ${noCRAA ? 'opacity-40 grayscale pointer-events-none' : ''}`}
      >
        <CardHeader className='pb-3'>
          <div className='relative'>
            <div className='aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center mb-3 overflow-hidden relative'>
              {getNFTImage(nft) ? (
                <Image
                  src={getNFTImage(nft)}
                  alt={`CrazyCube #${tokenIdDecimal}`}
                  width={160}
                  height={160}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center'>
                  <span className='text-xl font-bold text-white'>
                    {tokenIdDecimal}
                  </span>
                </div>
              )}

              {/* 🔥 Overlay burn animation tied to current step */}
              {step !== 'idle' && (
                <CardBurnOverlay
                  level={
                    step === 'approvingCRAA'
                      ? 1
                      : step === 'approvingNFT'
                        ? 2
                        : 3
                  }
                />
              )}
            </div>

            {gameData && (
              <Badge
                className={`absolute top-1.5 right-1.5 ${rarityInfo(gameData.rarity).color} text-white text-xs`}
              >
                <Star className='w-2 h-2 mr-0.5' />
                {rarityInfo(gameData.rarity).text}
              </Badge>
            )}

            {gameData && gameData.currentStars > 0 && (
              <div className='absolute top-2 left-2 flex space-x-1'>
                {Array.from({ length: gameData.currentStars }).map((_, i) => (
                  <Star
                    key={i}
                    className='w-4 h-4 text-yellow-400 fill-current'
                  />
                ))}
              </div>
            )}

            {gameData && gameData.isInGraveyard && (
              <div className='absolute bottom-2 left-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded'>
                💀 Graveyard
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='text-center mb-4'>
            <h3 className='font-semibold text-white text-lg mb-1'>
              {nft.title || `CrazyCube #${tokenIdDecimal}`}
            </h3>
            <p className='text-sm text-gray-400'>Token ID: {tokenIdDecimal}</p>
            {gameData ? (
              <div className='text-xs text-gray-500 mt-2 space-y-1'>
                <p>
                  ⭐ Stars: {gameData.currentStars}/{gameData.initialStars}
                </p>
                {Number(gameData.lockedCRAA) > 0 ? (
                  <p className='text-lg font-extrabold text-orange-400'>
                    💰 CRAA: {gameData.lockedCRAA}
                  </p>
                ) : (
                  <p className='text-sm text-gray-500'>No CRAA locked</p>
                )}
                {/* Ping & Breed status condensed */}
                <p>
                  <SatelliteDish className='inline w-3 h-3 mr-1' />
                  {pingReady
                    ? t('status.ready', 'Ready') + ' ✓'
                    : `Ping ${formatDuration(pingTimeLeft)}`}
                </p>
                <p>
                  <Heart className='inline w-3 h-3 mr-1' />
                  {breedReady
                    ? t('status.ready', 'Ready') + ' ✓'
                    : gameData.currentStars === 0
                      ? t('status.noStarsLeft', 'No Stars')
                      : `Breed ${formatDuration(breedTimeLeft)}`}
                </p>
                <p>
                  {gameData.isActivated ? '✅ Activated' : '❌ Not Activated'}
                </p>
              </div>
            ) : (
              <div className='text-xs text-gray-500 mt-2'>
                <Loader2 className='w-4 h-4 animate-spin inline-block mr-1' />{' '}
                Loading...
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Button
              variant={selected ? 'default' : 'outline'}
              className={
                selected
                  ? 'w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500'
                  : 'w-full border-orange-500/30 text-orange-300 hover:bg-orange-500/10'
              }
              onClick={() => setSelected(!selected)}
              disabled={isProcessing || noCRAA}
            >
              {selected ? (
                <>
                  <Flame className='mr-2 h-4 w-4' /> Selected
                </>
              ) : (
                <>
                  <Zap className='mr-2 h-4 w-4' /> Select
                </>
              )}
            </Button>

            {selected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <Button
                  className='w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white'
                  disabled={isProcessing || gameData?.isInGraveyard}
                  onClick={handleBurn}
                >
                  {isProcessing ? (
                    <>
                      <Clock className='mr-2 h-4 w-4 animate-spin' />
                      {step === 'approvingCRAA' && 'Approving CRAA...'}
                      {step === 'approvingNFT' && 'Approving NFT...'}
                      {step === 'burning' && 'Burning NFT...'}
                    </>
                  ) : gameData?.isInGraveyard ? (
                    <>💀 Already Burned</>
                  ) : (
                    <>
                      <Flame className='mr-2 h-4 w-4' /> Burn It!
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Wait period selector */}
          {selected && !gameData?.isInGraveyard && (
            <div className='flex justify-center gap-2 mb-2'>
              {[12, 60, 255].map(m => (
                <Button
                  key={m}
                  variant={waitMinutes === m ? 'default' : 'outline'}
                  className={
                    waitMinutes === m
                      ? 'px-3 py-1'
                      : 'px-3 py-1 border-orange-500/30'
                  }
                  onClick={() => setWaitMinutes(m as 12 | 60 | 255)}
                  disabled={isProcessing}
                >
                  {m}
                </Button>
              ))}
            </div>
          )}

          {/* Share breakdown */}
          {selected && gameData && (
            <div className='text-xs text-gray-400 mb-2 space-y-1'>
              {(() => {
                const s = calcShares();
                return (
                  <>
                    <p>
                      👤 You will get:{' '}
                      <span className='text-orange-300'>{s.user} CRAA</span> (
                      {burnSplit.playerBps / 100}%)
                    </p>
                    <p>
                      🏦 To Pool: {s.pool} CRAA ({burnSplit.poolBps / 100}%)
                    </p>
                    <p>
                      🔥 Burned: {s.burn} CRAA ({burnSplit.burnBps / 100}%)
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      {gameData && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className='bg-[#2f2b2b]/95 border border-red-500/30 text-gray-100 max-w-md text-[15px]'>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center text-red-300 text-lg'>
                <Flame className='w-5 h-5 mr-2' /> {t('burn.confirmDialog.title', { tokenId: tokenIdDecimal })}
              </AlertDialogTitle>
              <div className='space-y-2 text-orange-50'>
                <div className='bg-yellow-900/30 border border-yellow-500/50 rounded-md p-3 mb-3'>
                  <div className='text-yellow-200 font-semibold mb-1'>
                    {t('burn.confirmDialog.warning')}
                  </div>
                  <div className='text-yellow-100 text-sm'>
                    {t('burn.confirmDialog.description')}
                  </div>
                </div>
                <div>
                  {t('burn.confirmDialog.waitPeriod')}{' '}
                  <span className='font-medium text-orange-300'>
                    {waitMinutes} {t('burn.confirmDialog.minutes')}
                  </span>
                </div>
                <div>
                  {t('burn.confirmDialog.lockedCRAA')}{' '}
                  <span className='font-mono text-yellow-300'>
                    {gameData.lockedCRAA && Number(gameData.lockedCRAA) > 0
                      ? gameData.lockedCRAA
                      : '0'}{' '}
                    CRAA
                  </span>
                </div>
                <div>
                  {t('burn.confirmDialog.fee')}{' '}
                  <span className='font-mono text-red-300'>
                    {calcFee()} CRAA
                  </span>
                </div>
                {(() => {
                  const s = calcShares();
                  return (
                    <div className='pt-1 text-xs text-gray-300 space-y-0.5'>
                      <div className='bg-gray-800/60 border border-green-400/40 rounded-md px-2 py-1 flex justify-between items-center text-base font-semibold text-green-200'>
                        <span>{t('burn.confirmDialog.afterBurn')}</span>
                        <span className='font-mono'>{s.user}</span>
                      </div>
                      <div>
                        {t('burn.confirmDialog.poolReceives')}{' '}
                        <span className='text-orange-300 font-mono'>
                          {s.pool}
                        </span>
                      </div>
                      <div>
                        {t('burn.confirmDialog.burnedForever')}{' '}
                        <span className='text-red-400 font-mono'>
                          {s.burn} CRAA
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className='pt-2 text-xs text-gray-400'>
                  {t('burn.confirmDialog.transactions')}
                  <br />
                  {t('burn.confirmDialog.transaction1')} • {t('burn.confirmDialog.transaction2')} • {t('burn.confirmDialog.transaction3')}
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('burn.confirmDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDialogOpen(false);
                  confirmBurn();
                }}
              >
                {t('burn.confirmDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
}
