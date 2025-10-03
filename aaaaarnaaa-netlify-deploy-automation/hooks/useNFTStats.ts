'use client';

/**
 * @deprecated This hook is deprecated. Use useGameStats instead for consolidated game statistics.
 * This hook will be removed in a future version.
 */

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { NFT_CONTRACT_ADDRESS, MAIN_CHAIN_ID } from '@/config/wagmi';
import { nftAbi } from '@/config/abis/nftAbi';
import { formatEther } from 'viem';
import type { NFTStats } from '@/types/nft';

export function useNFTStats() {
  const [stats, setStats] = useState<NFTStats>({
    totalSupply: 0,
    burnedCount: 0,
    mintedCount: 0,
    inGraveyard: 0,
    burned24h: 0,
    minted24h: 0,
    bridged24h: 0,
    rewardPool: '0',
    monthlyUnlock: '0',
    totalValueLocked: '0',
    holders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // totalSupply from ERC721 (NFT contract)
  const { data: totalSupply } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: 'totalSupply',
    chainId: MAIN_CHAIN_ID,
  });

  // graveyard size and burnRewardPool from game contract
  const gameAddress = (
    process.env.NEXT_PUBLIC_CRAZYCUBE_CONTRACT &&
    process.env.NEXT_PUBLIC_CRAZYCUBE_CONTRACT !== 'undefined'
      ? process.env.NEXT_PUBLIC_CRAZYCUBE_CONTRACT
      : '0x606a47707d5aEdaE9f616A6f1853fE3075bA740B'
  ) as `0x${string}`;

  const { data: graveyardSize } = useReadContract({
    address: gameAddress,
    abi: nftAbi,
    functionName: 'totalBurned',
    chainId: MAIN_CHAIN_ID,
  });

  const { data: burnRewardPool } = useReadContract({
    address: gameAddress,
    abi: nftAbi,
    functionName: 'burnRewardPool',
    chainId: MAIN_CHAIN_ID,
  });

  // Update statistics when data changes
  useEffect(() => {
    try {
      // If data is loaded, update statistics
      if (totalSupply !== undefined) {
        setStats(prev => ({
          ...prev,
          totalSupply: totalSupply ? Number(totalSupply) : prev.totalSupply,
          burnedCount: 0,
          mintedCount: totalSupply ? Number(totalSupply) : 0,
          inGraveyard: graveyardSize ? Number(graveyardSize) : prev.inGraveyard,
          rewardPool:
            typeof burnRewardPool === 'bigint'
              ? formatEther(burnRewardPool)
              : prev.rewardPool,
          monthlyUnlock: '0',
        }));
        setIsLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to update stats')
      );
      setIsLoading(false);
    }
  }, [totalSupply, graveyardSize, burnRewardPool]);

  // Initialize empty statistics if data is not loaded
  useEffect(() => {
    if (isLoading && !totalSupply) {
      // Show empty data while loading
      setStats({
        totalSupply: 0,
        burnedCount: 0,
        mintedCount: 0,
        inGraveyard: 0,
        burned24h: 0,
        minted24h: 0,
        bridged24h: 0,
        rewardPool: '0',
        monthlyUnlock: '0',
        totalValueLocked: '0',
        holders: 0,
      });
      setIsLoading(false);
    }
  }, [isLoading, totalSupply]);

  return {
    stats,
    isLoading,
    error,
  };
}
