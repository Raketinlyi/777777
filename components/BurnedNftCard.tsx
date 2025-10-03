'use client';

import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
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
import { useClaimBurnReward } from '@/hooks/useClaimBurnReward';

interface BurnRecord {
  owner: `0x${string}`;
  totalAmount: bigint;
  claimAvailableTime: bigint;
  graveyardReleaseTime: bigint;
  claimed: boolean;
  waitPeriod: number;
}

interface BurnSplit {
  playerBps: number;
  poolBps: number;
  burnBps: number;
}

interface BurnedNftCardProps {
  tokenId: string;
  record: BurnRecord;
  split: BurnSplit;
  playerShare: bigint;
  isReadyToClaim: boolean;
}

export const BurnedNftCard = React.memo(function BurnedNftCard({
  tokenId,
  record,
  split,
  playerShare,
  isReadyToClaim: initialIsReadyToClaim,
}: BurnedNftCardProps) {
  const [isClaimReady, setIsClaimReady] = useState(() => {
    return initialIsReadyToClaim;
  });
  const { claim, isClaiming, isSuccess } = useClaimBurnReward(tokenId);
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
    if (craa >= 1_000_000) {
      return `${(craa / 1_000_000).toFixed(1)}M`;
    } else if (craa >= 1_000) {
      return `${(craa / 1_000).toFixed(1)}K`;
    } else if (craa >= 1) {
      return craa.toFixed(2);
    } else {
      return craa.toFixed(4);
    }
  };

  const handleClaim = async () => {
    try {
      await claim();
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  const handleCountdownComplete = () => {
    setIsClaimReady(true);
  };

  const poolShare = (record.totalAmount * BigInt(split.poolBps)) / BigInt(10000);
  const burnShare = (record.totalAmount * BigInt(split.burnBps)) / BigInt(10000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className='bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 hover:border-violet-500/50 transition-all duration-300'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg font-bold text-white flex items-center justify-between'>
            <span>NFT #{tokenId}</span>
            <span className='text-sm text-violet-400'>
              {record.claimed ? '✓ Claimed' : isClaimReady ? '🎁 Ready' : '⏰ Pending'}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Accumulated Rewards */}
          <div className='bg-slate-800/30 rounded-lg p-3'>
            <div className='text-sm text-slate-400 mb-1'>
              {t('rewards.accumulated', 'Accumulated Rewards')}
            </div>
            <div className='text-xl font-bold text-violet-300'>
              {fmt(record.totalAmount)} CRAA
            </div>
          </div>

          {/* Shares Breakdown */}
          <div className='grid grid-cols-3 gap-2 text-xs'>
            <div className='bg-blue-500/10 rounded p-2 text-center'>
              <div className='text-blue-400 font-medium'>Pool</div>
              <div className='text-white'>{fmt(poolShare)}</div>
              <div className='text-slate-400'>{(split.poolBps / 100).toFixed(1)}%</div>
            </div>
            <div className='bg-green-500/10 rounded p-2 text-center'>
              <div className='text-green-400 font-medium'>Player</div>
              <div className='text-white'>{fmt(playerShare)}</div>
              <div className='text-slate-400'>{(split.playerBps / 100).toFixed(1)}%</div>
            </div>
            <div className='bg-red-500/10 rounded p-2 text-center'>
              <div className='text-red-400 font-medium'>Burn</div>
              <div className='text-white'>{fmt(burnShare)}</div>
              <div className='text-slate-400'>{(split.burnBps / 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Player Claimable Amount */}
          <div className='bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg p-3 border border-violet-500/20'>
            <div className='text-sm text-slate-400 mb-1'>
              {t('rewards.claimable', 'Available to Claim')}
            </div>
            <div className='text-2xl font-bold text-violet-300'>
              {fmt(playerShare)} CRAA
            </div>
          </div>

          {/* Countdown or Ready Status */}
          {!isClaimReady && !record.claimed && (
            <div className='bg-slate-800/30 rounded-lg p-3'>
              <div className='text-sm text-slate-400 mb-2'>
                {t('rewards.countdown', 'Claim available in')}
              </div>
              <Countdown
                targetTimestamp={BigInt(record.claimAvailableTime ?? 0)}
                onComplete={handleCountdownComplete}
              />
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleClaim}
            disabled={!isClaimReady || record.claimed || isClaiming}
            className='w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700'
          >
            {isClaiming
              ? t('rewards.claiming', 'Claiming...')
              : record.claimed
              ? t('rewards.claimed', 'Claimed')
              : isClaimReady
              ? t('rewards.claim', 'Claim Rewards')
              : t('rewards.wait', 'Wait for Countdown')}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
});

export default BurnedNftCard;
