'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { monadChain } from '../config/chains';

const GAME_ADDR = monadChain.contracts.gameProxy.address;

// Comprehensive ABI for game contract stats
const GAME_STATS_ABI = [
  {
    name: 'totalBurned',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getBreedCostCRA',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'monthlyRewardPool',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalLockedForRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'mainTreasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalBurnedOCTAA',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'octaaToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'rewardRatePerSecond',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'pingInterval',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'breedCooldown',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'graveyardCooldown',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'burnFeeBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'manualFloorPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'monthlyUnlockPercentage',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'perPingCapDivisor',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'nftContract',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'octaaToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const ERC721_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const DEAD_ADDRESS =
  '0x000000000000000000000000000000000000dEaD' as `0x${string}`;

/**
 * Consolidated game statistics interface combining all relevant game metrics
 *
 * Note: The collection is capped at 9,700 NFTs.
 * Breeding doesn't create new NFTs - it revives burned ones from the graveyard.
 */
export interface GameStats {
  // Core Token Statistics
  totalOCTAABurned: string;
  totalCRAABurned: string; // Backwards compatibility alias
  totalTokensBurned: string;
  totalNFTs: number; // Always 9,700 (max collection size)
  activeCubes: number; // Active cubes out of 9,700

  // Pool Information
  currentMonthlyPool: string;
  currentLockedPool: string;
  mainTreasury: string;

  // Game Configuration
  currentBreedCost: string;
  rewardRatePerSecond: string;
  pingInterval: string;
  breedCooldown: string;
  graveyardCooldown: string;
  burnFeeBps: string;
  manualFloorPrice: string;
  monthlyUnlockPercentage: string;
  perPingCapDivisor: string;

  // Game State
  isPaused: boolean;
  graveyardSize: string;

  // OCTAA Token Stats
  octaaTotalSupply: string;
  craaTotalSupply: string; // Backwards compatibility alias
  octaaDeadBalance: string;
  craaDeadBalance: string; // Backwards compatibility alias

  // Calculated Values
  burnFeePercentage: number;
  monthlyUnlockPercent: number;

  lastUpdated: number;
}

/**
 * Consolidated game statistics hook
 *
 * This hook replaces the following deprecated hooks:
 * - useNFTStats
 * - useCrazyCubeStats
 * - useCRAATokenStat
 * - Individual contract stat hooks
 *
 * @returns {object} Game statistics and utility functions
 */
export const useGameStats = () => {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient();

  const fetchGameStats = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      // First get contract addresses
      const [nftAddress, octaaAddress] = (await Promise.all([
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'nftContract',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'octaaToken',
        }),
      ])) as [`0x${string}`, `0x${string}`];

      // Fetch all stats in parallel for optimal performance
      const [
        totalOCTAABurned,
        totalTokensBurned,
        currentMonthlyPool,
        currentLockedPool,
        mainTreasury,
        currentBreedCost,
        rewardRatePerSecond,
        pingInterval,
        breedCooldown,
        graveyardCooldown,
        burnFeeBps,
        manualFloorPrice,
        monthlyUnlockPercentage,
        perPingCapDivisor,
        isPaused,
        nftTotalSupply,
        octaaTotalSupply,
        octaaDeadBalance,
      ] = await Promise.all([
        // Game contract stats
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'totalBurnedOCTAA',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'totalBurned',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'monthlyRewardPool',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'totalLockedForRewards',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'mainTreasury',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'getBreedCostCRA',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'rewardRatePerSecond',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'pingInterval',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'breedCooldown',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'graveyardCooldown',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'burnFeeBps',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'manualFloorPrice',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'monthlyUnlockPercentage',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'perPingCapDivisor',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: GAME_STATS_ABI,
          functionName: 'paused',
        }),
        // NFT contract stats
        publicClient.readContract({
          address: nftAddress,
          abi: ERC721_ABI,
          functionName: 'totalSupply',
        }),
  // OCTAA token stats (legacy CRAA)
        publicClient.readContract({
          address: octaaAddress,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }),
        publicClient.readContract({
          address: octaaAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [DEAD_ADDRESS],
        }),
      ]);

      const burnedCount = Number(totalTokensBurned as bigint);
      const totalNFTCount = Number(nftTotalSupply as bigint);

  // Max NFTs is always 9,700 regardless of breeding (breeding revives from graveyard)
      const MAX_NFTS = 9700;

      // Simplified logic to avoid negative values:
      // - Total NFTs = always 5000 (original collection limit)
      // - Active NFTs = current totalSupply (real active NFTs)
      // - Graveyard = totalBurned (simple count of burned NFTs)
      const activeCount = totalNFTCount;
      const graveyardCount = burnedCount;

      const burnFeePercent = Number(burnFeeBps as bigint) / 100;
      const monthlyUnlockPercent =
        Number(monthlyUnlockPercentage as bigint) / 100;

      const totalOCTAAFormatted = formatEther(totalOCTAABurned as bigint);
      const octaaSupplyFormatted = formatEther(octaaTotalSupply as bigint);
      const octaaDeadFormatted = formatEther(octaaDeadBalance as bigint);

      const gameStats: GameStats = {
        totalOCTAABurned: totalOCTAAFormatted,
        totalCRAABurned: totalOCTAAFormatted,
        totalTokensBurned: (totalTokensBurned as bigint).toString(),
  totalNFTs: MAX_NFTS, // Always 9,700 regardless of current supply
        activeCubes: activeCount,
        currentMonthlyPool: formatEther(currentMonthlyPool as bigint),
        currentLockedPool: formatEther(currentLockedPool as bigint),
        mainTreasury: formatEther(mainTreasury as bigint),
        currentBreedCost: formatEther(currentBreedCost as bigint),
        rewardRatePerSecond: formatEther(rewardRatePerSecond as bigint),
        pingInterval: (pingInterval as bigint).toString(),
        breedCooldown: (breedCooldown as bigint).toString(),
        graveyardCooldown: (graveyardCooldown as bigint).toString(),
        burnFeeBps: (burnFeeBps as bigint).toString(),
        manualFloorPrice: formatEther(manualFloorPrice as bigint),
        monthlyUnlockPercentage: (monthlyUnlockPercentage as bigint).toString(),
        perPingCapDivisor: (perPingCapDivisor as bigint).toString(),
        isPaused: isPaused as boolean,
        graveyardSize: graveyardCount.toString(), // Use calculated graveyard count
        octaaTotalSupply: octaaSupplyFormatted,
        craaTotalSupply: octaaSupplyFormatted,
        octaaDeadBalance: octaaDeadFormatted,
        craaDeadBalance: octaaDeadFormatted,
        burnFeePercentage: burnFeePercent,
        monthlyUnlockPercent: monthlyUnlockPercent,
        lastUpdated: Date.now(),
      };

      setStats(gameStats);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch game stats');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchGameStats();
  }, [fetchGameStats]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchGameStats, 120000);
    return () => clearInterval(interval);
  }, [fetchGameStats]);

  // Helper functions for formatting
  const formatSeconds = (seconds: string) => {
    const secs = parseInt(seconds);
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  };

  const formatBPS = (bps: string) => {
    const percentage = (parseInt(bps) / 100).toFixed(2);
    return `${percentage}%`;
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US').format(num);
  };

  return {
    stats,
    isLoading,
    error,
    refresh: fetchGameStats,

    // Formatted getters
    get pingIntervalFormatted() {
      return stats ? formatSeconds(stats.pingInterval) : '0';
    },

    get breedCooldownFormatted() {
      return stats ? formatSeconds(stats.breedCooldown) : '0';
    },

    get graveyardCooldownFormatted() {
      return stats ? formatSeconds(stats.graveyardCooldown) : '0';
    },

    get burnFeeFormatted() {
      return stats ? formatBPS(stats.burnFeeBps) : '0%';
    },

    get monthlyUnlockFormatted() {
      return stats ? formatBPS(stats.monthlyUnlockPercentage) : '0%';
    },

    // Convenience getters for backward compatibility
    get totalNFTs() {
      return stats?.totalNFTs ?? 0;
    },

    get inGraveyard() {
      return parseInt(stats?.graveyardSize ?? '0');
    },

    get rewardPoolCRAA() {
      return stats?.currentMonthlyPool ?? '0';
    },

    get craSupply() {
      return stats?.craaTotalSupply ?? '0';
    },

    get breedCost() {
      return stats?.currentBreedCost ?? '0';
    },

    // Utility functions
    formatNumber,
    formatSeconds,
    formatBPS,
  };
};
