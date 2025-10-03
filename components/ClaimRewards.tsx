﻿'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatEther } from 'viem';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
// lightweight image for reward card (keep simple, avoid custom props mismatch)
import { WalletConnectNoSSR as WalletConnect } from '@/components/web3/wallet-connect.no-ssr';

import { useToast } from '@/hooks/use-toast';
import { usePendingBurnRewards, BurnReward } from '@/hooks/usePendingBurnRewards';
import { useClaimBlocking } from '@/hooks/useClaimBlocking';
import { useNetwork } from '@/hooks/use-network';

import { coreContractConfig } from '@/lib/contracts';

import {
  AlertCircle,
  Gift,
  Loader2,
  ShieldAlert,
  Timer,
  Wallet,
} from 'lucide-react';

const formatRewardValue = (wei: string): string => {
  try {
    // Return only the integer part, no decimals, no grouping.
    const [whole] = formatEther(BigInt(wei)).split('.');
    return whole ?? '0';
  } catch {
    return '0';
  }
};

type RewardCardProps = {
  reward: BurnReward;
  onClaim: (reward: BurnReward) => void | Promise<void>;
  disabled: boolean;
  isProcessing: boolean;
  errorMessage?: string | null | undefined;
  index: number;
};

const clearRewardCaches = (address?: string) => {
  if (typeof window === 'undefined' || !address) return;
  const cacheKeys = [
    `crazycube:burnedNfts:${address}`,
    `crazycube:claimable:${address}`,
    `${address}:pendingRewards`,
  ];

  for (const key of cacheKeys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore storage quota or availability issues
    }
  }
};

const mapErrorToKey = (error: unknown): string => {
  if (!error) return 'sections.claim.errors.unexpected';

  const name = (error as { name?: string }).name ?? '';
  const message = `${(error as { message?: string }).message ?? ''} ${
    (error as { shortMessage?: string }).shortMessage ?? ''
  }`
    .toLowerCase()
    .trim();

  if (
    name === 'UserRejectedRequestError' ||
    message.includes('user rejected') ||
    message.includes('rejected the request') ||
    message.includes('denied the request')
  ) {
    return 'sections.claim.errors.rejected';
  }
  if (message.includes('early')) return 'sections.claim.errors.tooEarly';
  if (message.includes('owner')) return 'sections.claim.errors.notOwner';
  if (message.includes('claimed')) return 'sections.claim.errors.alreadyClaimed';
  if (message.includes('paused')) return 'sections.claim.errors.paused';
  if (message.includes('insufficient')) return 'sections.claim.errors.insufficient';

  return 'sections.claim.errors.unexpected';
};

const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  onClaim,
  disabled,
  isProcessing,
  errorMessage,
  index,
}) => {
  const { t } = useTranslation();

  const imgIdx = (index % 9) + 1;
  const imageSrc = `/images/z${imgIdx}.png`;
  const brightness = 1 + (Math.floor(index / 9) % 6) * 0.07;

  const nowSec = Math.floor(Date.now() / 1000);
  const remaining = Math.max(0, reward.claimAt - nowSec);
  const isClaimable = reward.isClaimable && remaining <= 0;

  const getCardTheme = () => {
    if (reward.claimed) {
      return {
        cardClass: 'border-blue-500/30 bg-slate-900/80',
        hoverGlow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]',
        stripeColor: 'rgba(59, 130, 246, 0.1)',
        buttonClass: 'bg-slate-700/60 text-slate-300',
      };
    } else if (isClaimable) {
      return {
        cardClass: 'border-cyan-400/50 bg-cyan-900/40',
        hoverGlow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]',
        stripeColor: 'rgba(6, 182, 212, 0.15)',
        buttonClass: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]',
      };
    } else {
      return {
        cardClass: 'border-purple-500/40 bg-purple-900/40',
        hoverGlow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]',
        stripeColor: 'rgba(139, 92, 246, 0.1)',
        buttonClass: 'border-gray-500/40 bg-gray-800/40 text-gray-300',
      };
    }
  };

  const cardTheme = getCardTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className='group w-full max-w-[320px] mx-auto' // Increased size
    >
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 backdrop-blur-lg',
          cardTheme.cardClass,
          cardTheme.hoverGlow
        )}
      >
        {/* Subtle animated stripes */}
        <div
          className='absolute inset-0 opacity-30 mix-blend-overlay animated-stripes'
          style={{ '--stripe-color': cardTheme.stripeColor } as React.CSSProperties}
        />
        
        <div className='relative z-10 flex flex-col h-full p-4 text-center'>
          {/* Header */}
          <div className='flex-shrink-0'>
            <Image
              src={imageSrc}
              alt={`Cube #${reward.tokenId}`}
              width={64}
              height={64}
              className='w-16 h-16 object-cover rounded-lg mx-auto ring-2 ring-white/10 shadow-lg'
              style={{ filter: `brightness(${brightness}) saturate(1.5) hue-rotate(20deg)` }}
            />
            <p className='mt-2 font-semibold text-white text-lg'>Cube #{reward.tokenId}</p>
            <div className='flex items-center justify-center gap-1.5 text-xs mt-1'>
              {reward.claimed ? (
                <span className='font-medium text-green-300'>{t('sections.claim.status.claimed', 'Claimed')}</span>
              ) : isClaimable ? (
                <span className='font-medium text-cyan-300 flex items-center gap-1.5'>
                  <div className='w-2 h-2 rounded-full bg-cyan-400 animate-pulse'></div>
                  {t('sections.claim.status.ready', 'Ready to Claim')}
                </span>
              ) : (
                <span className='font-mono text-purple-300 flex items-center gap-1.5'>
                  <Timer className='w-3 h-3' />
                  {Math.floor(remaining / 60)}m {String(remaining % 60).padStart(2, '0')}s
                </span>
              )}
            </div>
          </div>

          {/* Reward Amount (Main Content) */}
          <div className='flex-grow flex flex-col justify-center items-center my-4 min-h-[80px]'>
            <span className='text-sm text-black font-bold'>{t('sections.claim.rewardAmount', 'Reward')}</span>
            <svg viewBox="0 0 100 12" preserveAspectRatio="xMidYMid meet" className="w-full h-12">
              <defs>
                <linearGradient id="reward-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" />
                  <stop offset="100%" stopColor="#67E8F9" />
                </linearGradient>
              </defs>
              <text 
                x="50" 
                y="9" 
                textAnchor="middle" 
                className='font-black font-mono'
                fill="black"
                textLength="98" 
                lengthAdjust="spacingAndGlyphs"
              >
                {formatRewardValue(reward.playerAmount)}
              </text>
            </svg>
            <span className='text-lg font-bold text-black -mt-2'>OCTAA</span>
          </div>

          {/* Footer with Button */}
          <div className='flex-shrink-0 mt-auto'>
            {errorMessage && (
              <div className='text-xs text-red-300 mb-2'>
                {errorMessage}
              </div>
            )}
            {reward.claimed ? (
              <Button disabled className={cn('w-full h-10 text-sm font-semibold', cardTheme.buttonClass)}>
                {t('sections.claim.status.claimed', 'Already claimed')}
              </Button>
            ) : (
              <Button
                onClick={() => onClaim(reward)}
                disabled={disabled || isProcessing || !isClaimable}
                className={cn('w-full h-10 text-sm font-semibold transition-all duration-300', cardTheme.buttonClass)}
              >
                {isProcessing ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  <Gift className='mr-2 h-4 w-4' />
                )}
                {t('sections.claim.buttons.claim', 'Claim Reward')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
export const ClaimRewards: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const {
    isMonadChain,
    switchToMonadChain,
    isSwitching,
  } = useNetwork();
  const {
    rewards,
    loading,
    error,
    paused,
    refreshing,
    refresh,
  } = usePendingBurnRewards();
  const { isBlocked, timeLeft, blockClaimSection } = useClaimBlocking();

  const [claimingTokenId, setClaimingTokenId] = useState<string | null>(null);
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, 'claimed'>>({});
  const [manualRewards, setManualRewards] = useState<BurnReward[]>([]);

  // timer for `now` removed

  useEffect(() => {
    if (!Object.keys(optimisticStatus).length) return;
    setOptimisticStatus(prev => {
      const next = { ...prev };
      let changed = false;
      for (const reward of rewards) {
        if (reward.claimed && next[reward.tokenId]) {
          delete next[reward.tokenId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rewards, optimisticStatus]);

  // When on-chain rewards arrive, remove any manualRewards that are now present in fetched rewards
  useEffect(() => {
    if (!manualRewards.length || !rewards.length) return;
    setManualRewards(prev => prev.filter(m => !rewards.some(r => r.tokenId === m.tokenId)));
  }, [rewards, manualRewards.length]);

  const normalizedRewards = useMemo(() => {
    // Merge manual (quickCheck) rewards with fetched rewards; fetched rewards take precedence
    const mergedMap = new Map<string, BurnReward>();
    for (const r of [...manualRewards, ...rewards]) {
      if (!mergedMap.has(r.tokenId)) mergedMap.set(r.tokenId, r);
    }
  const merged = Array.from(mergedMap.values()).filter(r => r.tokenId);
    if (!Object.keys(optimisticStatus).length) return merged;
    return merged.map(reward => (
      optimisticStatus[reward.tokenId]
        ? { ...reward, claimed: true, isClaimable: false }
        : reward
    ));
  }, [manualRewards, rewards, optimisticStatus]);

  // Show all not-yet-claimed rewards (eligible + pending). Pending items will have disabled Claim button
  const displayRewards = useMemo(
    () => normalizedRewards.filter(r => !r.claimed),
    [normalizedRewards]
  );
  const handleClaim = useCallback(async (reward: BurnReward) => {
    // minimal, linear claim flow to avoid multiple wallet prompts and race conditions
    if (!address || !publicClient) {
      toast({ variant: 'destructive', title: 'Error', description: t('sections.claim.errors.unexpected', 'Unexpected error. Please try again.') });
      return;
    }
    if (paused) {
      toast({ variant: 'destructive', title: 'Error', description: t('sections.claim.errors.paused', 'Claims are paused') });
      return;
    }
    if (isBlocked) {
      toast({ variant: 'destructive', title: 'Error', description: t('sections.claim.blockedToast', 'Claim section is temporarily blocked. Please wait.') });
      return;
    }
    if (!reward.isClaimable || reward.claimed || reward.totalAmount === '0') {
      toast({ variant: 'destructive', title: 'Error', description: t('sections.claim.errors.tooEarly', 'Too early to claim') });
      return;
    }

    // prevent re-entrancy from UI
    if (claimingTokenId !== null) return;

    setClaimingTokenId(reward.tokenId);
    setClaimErrors((prev) => {
      const next = { ...prev };
      delete next[reward.tokenId];
      return next;
    });

    if (!isMonadChain) {
      toast({ variant: 'destructive', title: 'Error', description: t('sections.claim.errors.wrongNetwork', 'Switch to Monad testnet to claim rewards.') });
      return;
    }

    // perform the claim
    try {
      const th = toast({ title: t('sections.claim.txPending', 'Confirm the transaction in your wallet') });

      let tokenIdBigInt: bigint;
      try {
        tokenIdBigInt = BigInt(reward.tokenId);
      } catch {
        // tokenId parse failed
        // eslint-disable-next-line no-console
        console.error('Invalid tokenId for claim:', reward.tokenId);
        throw new Error('Invalid tokenId format');
      }

      // single write, wait for hash
      const hash = await writeContractAsync({
        address: coreContractConfig.address,
        abi: coreContractConfig.abi,
        functionName: 'claimBurnRewards',
        args: [tokenIdBigInt],
      });

      th.update({ id: th.id, title: t('sections.claim.txProcessing', 'Transaction submitted. Waiting for confirmations...') });

      if (publicClient && typeof publicClient.waitForTransactionReceipt === 'function') {
        await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
      }

      th.update({ id: th.id, title: t('sections.claim.successSingle', 'Reward claimed successfully!') });

      // tx tracking removed in simplified UI
      setOptimisticStatus((prev) => ({ ...prev, [reward.tokenId]: 'claimed' }));
      clearRewardCaches(address);
      blockClaimSection();
      await refresh();
    } catch (err) {
      const key = (err as Error)?.message === 'Invalid tokenId format' ? 'sections.claim.errors.invalidId' : mapErrorToKey(err);
      const baseMessage = t(key, t('sections.claim.errors.unexpected', 'Unexpected error. Please try again.'));
      // Always include token id in the visible error so the user knows which NFT failed
      const message = `${t('sections.claim.nftLabel', { defaultValue: 'NFT #{id}', id: reward.tokenId })}: ${baseMessage}`;
      toast({ variant: 'destructive', title: 'Error', description: message });
      setClaimErrors((prev) => ({ ...prev, [reward.tokenId]: message }));
    } finally {
      setClaimingTokenId(null);
    }
  }, [
    address,
    blockClaimSection,
    isBlocked,
    isMonadChain,
    paused,
    publicClient,
    refresh,
    t,
    toast,
    writeContractAsync,
    claimingTokenId,
  ]);

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Card className='border border-slate-800/60 bg-slate-900/60 shadow-xl shadow-black/10'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl text-slate-100'>
              <Wallet className='h-5 w-5 text-slate-300' />
              {t('sections.claim.noWallet.title', 'Connect Wallet')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-slate-300'>
            <p className='text-sm text-slate-400'>
              {t('sections.claim.noWallet.description', 'Connect your wallet to view and claim rewards from burned NFTs.')}
            </p>
            <WalletConnect />
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  if (!isMonadChain) {
    return (
      <TooltipProvider>
        <Card className='border border-slate-800/60 bg-slate-900/60 shadow-xl shadow-black/10'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl text-slate-100'>
              <Wallet className='h-5 w-5 text-slate-300' />
              {t('sections.claim.wrongNetwork.title', 'Switch Network')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-slate-300'>
            <p className='text-sm text-slate-400'>
              {t('sections.claim.wrongNetwork.description', 'Claiming rewards is only available on the Monad testnet. Switch your wallet to continue.')}
            </p>
            <Button
              onClick={() => switchToMonadChain?.()}
              disabled={isSwitching}
              className='bg-emerald-500/80 text-slate-900 hover:bg-emerald-400'
            >
              {isSwitching ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('sections.claim.wrongNetwork.switching', 'Switching...')}
                </>
              ) : (
                <>
                  <Loader2 className='mr-2 h-4 w-4' />
                  {t('sections.claim.wrongNetwork.button', 'Switch to Monad testnet')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className='space-y-6'>
        {paused && (
          <div className='flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200'>
            <ShieldAlert className='h-5 w-5' />
            <div>
              <div className='font-medium'>{t('sections.claim.pausedBanner.title', 'Game is paused')}</div>
              <div>{t('sections.claim.pausedBanner.subtitle', 'Claims are temporarily unavailable.')}</div>
            </div>
          </div>
        )}

        {isBlocked && (
          <div className='flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/60 p-3 text-sm text-slate-200'>
            <Timer className='h-5 w-5 text-slate-300' />
            <div>
              <div className='font-medium'>{t('sections.claim.blockedBanner.title', 'Claim section blocked')}</div>
              <div>
                {t('sections.claim.blockedBanner.subtitle', 'Please wait before trying again.')}{' '}
                {timeLeft > 0 && (
                  <span className='text-slate-100'>
                    {t('sections.claim.blockedBanner.remaining', { defaultValue: '{seconds}s remaining', seconds: timeLeft })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className='rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200'>
            <div className='flex items-center gap-2 text-red-200'>
              <AlertCircle className='h-5 w-5' />
              <span>{error}</span>
            </div>
            <Button
              size='sm'
              className='mt-3 bg-red-500/80 text-red-900 hover:bg-red-400'
              onClick={() => refresh()}
            >
              {t('sections.claim.retry', 'Try again')}
            </Button>
          </div>
        )}

  {loading && displayRewards.length === 0 && (
          <div className='flex items-center justify-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/60 p-6 text-slate-300'>
            <Loader2 className='h-5 w-5 animate-spin text-emerald-300' />
            <span>{t('sections.claim.loading', 'Loading claimable rewards...')}</span>
          </div>
        )}

  {!loading && displayRewards.length === 0 && (
          <Card className='border border-slate-800/60 bg-slate-900/60 text-center text-slate-300'>
            <CardContent className='space-y-3 py-10'>
              <Gift className='mx-auto h-10 w-10 text-slate-500' />
              <div className='text-lg font-medium text-slate-100'>
                {t('sections.claim.empty.title', 'No rewards yet')}
              </div>
              <p className='text-sm text-slate-400'>
                {t('sections.claim.empty.description', 'Burn NFTs to start accumulating OCTA rewards. Eligible and pending rewards will appear here.')}
              </p>
            </CardContent>
          </Card>
        )}

        <div className='nft-card-grid'>
          {displayRewards.map((reward, index) => {
            return (
              <RewardCard
                key={reward.tokenId}
                reward={reward}
                onClaim={handleClaim}
                disabled={
                  paused ||
                  isBlocked ||
                  claimingTokenId !== null ||
                  refreshing
                }
                isProcessing={claimingTokenId === reward.tokenId}
                errorMessage={claimErrors[reward.tokenId] ?? null}
                index={index}
              />
            );
          })}
        </div>
        
      </div>
    </TooltipProvider>
  );
};
