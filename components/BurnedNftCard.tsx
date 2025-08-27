'use client';

import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { BurnedNftInfo, useClaimReward } from '@/hooks/useBurnedNfts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Countdown } from '@/components/Countdown';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface BurnedNftCardProps {
  nft: BurnedNftInfo;
}

export const BurnedNftCard = React.memo(function BurnedNftCard({
  nft,
}: BurnedNftCardProps) {
  const { tokenId, record, split, playerShare } = nft;
  const [isClaimReady, setIsClaimReady] = useState(() => {
    return nft.isReadyToClaim;
  });
  const { claim, isClaiming, isSuccess } = useClaimReward(tokenId);
  const { t } = useTranslation();

  const [hide, setHide] = useState(false);

  // Hide card when claimed
  useEffect(() => {
    if (isSuccess || record.claimed) {
      // wait small fade out
      setTimeout(() => setHide(true), 600);
    }
  }, [isSuccess, record.claimed]);

  if (hide) return null;

  // Helper formatter for human-readable CRA
  const fmt = (wei: bigint | string) => {
    const num = typeof wei === 'string' ? parseEther(wei) : wei;
    const craa = Number(formatEther(num));

    // Use compact notation for large numbers
    if (craa >= 1000000) {
      return (craa / 1000000).toFixed(2) + 'M';
    } else if (craa >= 1000) {
      return (craa / 1000).toFixed(2) + 'K';
    } else if (craa >= 1) {
      return craa.toFixed(2);
    } else {
      return craa.toFixed(4);
    }
  };

  const totalAmount = record.totalAmount;
  const poolShare = split ? (totalAmount * BigInt(split.poolBps)) / 10000n : 0n;
  const burnShare = split ? (totalAmount * BigInt(split.burnBps)) / 10000n : 0n;

  const handleClaim = async () => {
    if (!isClaimReady || isClaiming || isSuccess) return;
    await claim();
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      className='scale-[0.75]'
    >
      <Card
        className={`bg-gradient-to-br from-yellow-900/80 to-amber-800/80 border-2 rounded-xl transition-all duration-300 hover:scale-105 ${isClaimReady ? 'border-yellow-500/60' : 'border-amber-600/50 hover:border-amber-500/60'} flex flex-col h-full w-full max-w-[220px]`}
      >
        <div className='flex flex-col justify-between h-full'>
          <CardHeader className='p-0 mb-4'>
            <div className='aspect-square w-full overflow-hidden rounded-lg relative'>
              <img
                src={`/images/zol${(parseInt(tokenId) % 7) + 1}.png`}
                alt={`Cube #${tokenId}`}
                className='w-full h-full object-cover bg-slate-800'
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `/images/zol${(parseInt(tokenId) % 7) + 1}.png`;
                }}
              />
            </div>
            <CardTitle className='mt-4 text-center text-xl font-bold text-white'>
              {t('cube', 'Cube')} #{tokenId}
            </CardTitle>
          </CardHeader>

          <CardContent className='pt-0 pb-2 px-2 text-[10px] space-y-1 text-yellow-200'>
            <div className='flex justify-between'>
              <span>{t('rewards.accumulated', 'Accumulated:')}</span>{' '}
              <span className='font-medium text-white'>
                {fmt(totalAmount)} CRAA
              </span>
            </div>
            <div className='flex justify-between text-slate-400'>
              <span>
                {t('rewards.toPool', 'To pool')} (
                {Number(split?.poolBps || 0) / 100}%):
              </span>{' '}
              <span className='text-rose-300'>-{fmt(poolShare)} CRAA</span>
            </div>
            <div className='flex justify-between text-slate-400'>
              <span>
                {t('rewards.burned', 'Burned')} (
                {Number(split?.burnBps || 0) / 100}%):
              </span>{' '}
              <span className='text-rose-300'>-{fmt(burnShare)} CRAA</span>
            </div>

            {/* total payout highlight */}
            <div className='bg-black/50 rounded-md py-1 px-2 mt-2 text-center shadow-inner border border-yellow-700/40'>
              <div className='text-[11px] uppercase tracking-wider text-slate-300'>
                {t('rewards.toClaim', 'To claim')}
              </div>
              <div className='text-2xl font-extrabold text-emerald-300 drop-shadow-md'>
                {fmt(playerShare)} <span className='text-sm'>CRAA</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className='px-2 pb-2 mt-auto'>
            {record.claimed || isSuccess ? (
              <div className='w-full text-center font-bold text-lg py-3 rounded-lg bg-green-500/20 text-green-300'>
                {t('rewards.claimed', 'REWARD CLAIMED')} ✅
              </div>
            ) : (
              <div className='w-full'>
                <div className='text-amber-200 mb-2'>
                  {t('rewards.availableIn', 'Available in:')}
                </div>
                <Countdown
                  targetTimestamp={record.claimAvailableTime}
                  onComplete={() => setIsClaimReady(true)}
                />
                <Button
                  disabled={!isClaimReady || isClaiming}
                  onClick={handleClaim}
                  className='mt-2 w-full rounded-lg bg-amber-500 px-4 py-3 text-base font-bold text-black transition-all hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isClaiming
                    ? t('rewards.processing', 'PROCESSING...')
                    : t('rewards.claim', 'CLAIM')}
                </Button>
              </div>
            )}
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
});

export default BurnedNftCard;
