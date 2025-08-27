'use client';

import React, { useState } from 'react';
import { usePendingBurnRewards } from '@/hooks/usePendingBurnRewards';
import { useClaimReward } from '@/hooks/useBurnedNfts';
import { useClaimBlocking } from '@/hooks/useClaimBlocking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Gift, Coins, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChainId } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { SECURITY_CONFIG, validateChainId, validateContractAddress } from '@/config/security';
import DOMPurify from 'isomorphic-dompurify';

interface ClaimableNFTCardProps {
  tokenId: string;
  onClaim: (tokenId: string) => void;
  isLoading: boolean;
  isClaimed: boolean;
  claimMessage?: { type: 'success' | 'error'; message: string } | undefined;
}

const ClaimableNFTCard: React.FC<ClaimableNFTCardProps> = ({
  tokenId,
  onClaim,
  isLoading,
  isClaimed,
  claimMessage,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className='border-orange-500/30 bg-slate-900/50 backdrop-blur-sm hover:border-orange-500/50 transition-colors'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg font-semibold text-orange-100'>
              {`NFT #${tokenId}`}
            </CardTitle>
            <div className='flex gap-2'>
              <Badge variant='outline' className='border-orange-500/50 text-orange-300'>
                <Gift className='w-3 h-3 mr-1' />
                {t('sections.claim.claimable', 'Claimable')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-slate-400'>
              {t('sections.claim.rewardAmount', 'Reward Amount')}:
            </span>
            <span className='text-orange-300 font-semibold'>
              Calculating...
            </span>
          </div>

          {claimMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-lg text-sm ${
                claimMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}
            >
              {claimMessage.message}
            </motion.div>
          )}

          <div className='flex gap-2'>
            <Button
              onClick={() => onClaim(tokenId)}
              disabled={isLoading || isClaimed}
              className='flex-1 bg-orange-600 hover:bg-orange-700 text-white'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  {t('sections.claim.claiming', 'Claiming...')}
                </>
              ) : isClaimed ? (
                <>
                  <CheckCircle className='w-4 h-4 mr-2' />
                  {t('sections.claim.claimed', 'Claimed')}
                </>
              ) : (
                <>
                  <Coins className='w-4 h-4 mr-2' />
                  {t('sections.claim.claimReward', 'Claim Reward')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ClaimRewards = () => {
  const {
    rewards,
    loading: isLoadingNfts,
    error: nftsError,
    refresh,
  } = usePendingBurnRewards();
  const { toast } = useToast();
  const { t } = useTranslation();
  const chainId = useChainId();
  const { isBlocked, timeLeft } = useClaimBlocking();

  // State to track claimed NFTs and show messages
  const [claimedNFTs, setClaimedNFTs] = useState<Set<string>>(new Set());
  const [claimMessages, setClaimMessages] = useState<Map<string, { type: 'success' | 'error', message: string }>>(new Map());
  const [isClaiming, setIsClaiming] = useState(false);

  // Create individual claim hooks for each reward (max 6 to avoid hook rules violation)
  const claimHook0 = useClaimReward(rewards[0]?.tokenId || '0', refresh);
  const claimHook1 = useClaimReward(rewards[1]?.tokenId || '0', refresh);
  const claimHook2 = useClaimReward(rewards[2]?.tokenId || '0', refresh);
  const claimHook3 = useClaimReward(rewards[3]?.tokenId || '0', refresh);
  const claimHook4 = useClaimReward(rewards[4]?.tokenId || '0', refresh);
  const claimHook5 = useClaimReward(rewards[5]?.tokenId || '0', refresh);

  const handleClaim = async (tokenId: string) => {
    // CRITICAL: Validate chainId to prevent network spoofing
    if (!validateChainId(chainId)) {
      toast({
        title: 'Wrong Network',
        description: 'Please switch to ApeChain network',
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

    // Immediately block the button and show message
    setClaimedNFTs(prev => new Set(prev).add(tokenId));
    setIsClaiming(true);

    try {
      // Find the correct claim hook for this tokenId
      const claimHook = [claimHook0, claimHook1, claimHook2, claimHook3, claimHook4, claimHook5]
        .find((hook, index) => rewards[index]?.tokenId === tokenId);

      if (claimHook) {
        await claimHook.claim();
        
        // Show success message
        setClaimMessages(prev => new Map(prev).set(tokenId, {
          type: 'success',
          message: `NFT #${tokenId} reward claimed successfully! Updating contract data (2-5 minutes)...`
        }));
        
        // Refresh data after successful claim
        setTimeout(() => {
          refresh();
        }, 2000);
      } else {
        throw new Error('Claim hook not available for this token');
      }
      
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? DOMPurify.sanitize(error.message) : 'Failed to claim rewards';
      
      // Show error message
      setClaimMessages(prev => new Map(prev).set(tokenId, {
        type: 'error',
        message: `Transaction failed: ${errorMessage}`
      }));
      
      // Unblock the button on error
      setClaimedNFTs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenId);
        return newSet;
      });
      
      toast({
        title: 'Claim Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoadingNfts && rewards.length === 0) {
    return (
      <div className='flex justify-center items-center py-12'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className='w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full'
        />
        <span className='ml-3 text-green-300'>
          Loading claimable rewards...
        </span>
      </div>
    );
  }

  if (nftsError) {
    return (
      <div className='text-center py-12'>
        <AlertCircle className='w-12 h-12 text-red-400 mx-auto mb-4' />
        <div className='text-red-400 mb-2'>Error loading data</div>
        <div className='text-slate-400'>{nftsError}</div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className='text-center py-12'>
        <Gift className='w-12 h-12 text-slate-400 mx-auto mb-4' />
        <div className='text-slate-400 mb-2'>
          {t('sections.claim.noClaimableRewards', 'No claimable rewards found')}
        </div>
        <div className='text-sm text-slate-500'>
          {t('sections.claim.burnNFTsFirst', 'Burn some NFTs first to see claimable rewards here')}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-orange-100 mb-2'>
          {t('sections.claim.title', 'Claim Burn Rewards')}
        </h2>
        <p className='text-slate-400'>
          {t('sections.claim.description', 'Claim your CRAA rewards from burned NFTs')}
        </p>
      </div>

      {/* Blocking notice */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4'
        >
          <div className='text-yellow-300 text-lg mb-2'>
            ⏰ {t('sections.claim.blockedTitle', 'Claim Section Blocked')}
          </div>
          <p className='text-sm text-slate-400'>
            {t('sections.claim.blockedMessage', 'Please wait')} {timeLeft} {t('sections.claim.blockedMessage2', 'before claiming again')}
          </p>
        </motion.div>
      )}

      {/* Rewards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {rewards.map((reward) => (
          <ClaimableNFTCard
            key={reward.tokenId}
            tokenId={reward.tokenId}
            onClaim={handleClaim}
            isLoading={isClaiming || [claimHook0, claimHook1, claimHook2, claimHook3, claimHook4, claimHook5].some(hook => hook?.isClaiming)}
            isClaimed={claimedNFTs.has(reward.tokenId)}
            claimMessage={claimMessages.get(reward.tokenId)}
          />
        ))}
      </div>

      {/* Status Messages */}
      {(isClaiming || [claimHook0, claimHook1, claimHook2, claimHook3, claimHook4, claimHook5].some(hook => hook?.isClaiming)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'
        >
          <div className='flex justify-center items-center gap-2'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full'
            />
            <span className='text-blue-300'>
              {t('sections.claim.processingClaim', 'Processing claim...')}
            </span>
          </div>
        </motion.div>
      )}

      {[claimHook0, claimHook1, claimHook2, claimHook3, claimHook4, claimHook5].some(hook => hook?.isSuccess) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-green-500/10 border border-green-500/20 rounded-lg p-4'
        >
          <div className='text-green-400 text-lg'>
            🎉 Rewards Claimed Successfully!
          </div>
          <p className='text-sm text-slate-400 mt-1'>
            Your CRAA rewards have been transferred to your wallet.
          </p>
        </motion.div>
      )}

      {[claimHook0, claimHook1, claimHook2, claimHook3, claimHook4, claimHook5].some(hook => hook?.error) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-red-500/10 border border-red-500/20 rounded-lg p-4'
        >
          <div className='text-red-400 text-lg'>❌ Claim Failed</div>
          <p className='text-sm text-slate-400 mt-1'>
            {String([claimHook0, claimHook1, claimHook2, claimHook3, claimHook4, claimHook5].find(hook => hook?.error)?.error || 'Unknown error occurred')}
          </p>
        </motion.div>
      )}
    </div>
  );
};
