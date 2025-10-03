'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TOKEN_CONTRACT_ADDRESS } from '@/config/wagmi';
import { tokenAbi } from '@/config/abis/tokenAbi';
import { formatUnits } from 'viem';
import { useNFTs } from './useNFTs'; // Use fixed safe hook
import type { UserNFTStats } from '@/types/nft';

export function useUserNFTStats() {
  const { address, isConnected } = useAccount();
  // Use our new, safe hook to get NFTs
  const { nfts, isLoading: isNftsLoading } = useNFTs();

  const [stats, setStats] = useState<UserNFTStats>({
    totalOwned: 0,
    totalFrozen: 0,
    totalRewards: 0,
    estimatedValue: '0',
  });
  const [isLoading, setIsLoading] = useState(true); // General loading status
  const [error, setError] = useState<Error | null>(null);

  // Get user's token balance
  const { data: tokenBalance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Update user stats when data changes
  useEffect(() => {
    // Wait until both NFTs and token balance are loaded
    if (isNftsLoading || !isConnected) {
      return;
    }

    try {
      const totalOwned = nfts.length;
      const totalFrozen = nfts.filter(nft => nft.frozen).length;
      // TODO: Replace with real data from contract when available
      const totalRewards = nfts.reduce(
        (sum, nft) => sum + (nft.rewardBalance || 0),
        0
      );

      // REMOVE dangerous estimation based on NFT metadata
      // Show only real token balance

      const tokenValue = tokenBalance
        ? parseFloat(formatUnits(tokenBalance, 18))
        : 0;
      // In real app, add NFT value in tokens here,
      // obtained from marketplace API or verified contract
      const estimatedValue = tokenValue.toFixed(6); // Show only tokens

      setStats({
        totalOwned,
        totalFrozen,
        totalRewards,
        estimatedValue, // Now this is only tokens, without fake NFT estimation
      });

      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to update user stats')
      );
      setIsLoading(false);
    }
  }, [nfts, tokenBalance, isConnected, isNftsLoading]);

  // Reset state if wallet is disconnected
  useEffect(() => {
    if (!isConnected) {
      // Clear stats for disconnected users
      setStats({
        totalOwned: 0,
        totalFrozen: 0,
        totalRewards: 0,
        estimatedValue: '0',
      });
      setIsLoading(false);
      setError(null);
    }
  }, [isConnected]);

  return {
    stats,
    isLoading,
    error,
  };
}
