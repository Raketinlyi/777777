'use client';

/**
 * @deprecated This hook is deprecated. Use useGameStats instead for consolidated game statistics.
 * This hook will be removed in a future version. useGameStats provides the same functionality
 * with better performance and additional features.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { monadChain } from '../config/chains';

const GAME_ADDR = monadChain.contracts.gameProxy.address;

const toBigIntOrZero = (value: unknown): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value) return BigInt(value);
  return 0n;
};

// Minimal ABI for contract stats reading
const CONTRACT_ABI = [
  { name: 'totalBurned', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getBreedCostCRA', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'monthlyRewardPool', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalLockedForRewards', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'mainTreasury', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalBurnedOCTAA', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  // { name: 'totalStars', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
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
] as const;

export interface ContractStats {
  // Core Statistics
  totalOCTAABurned: string;
  totalCRAABurned: string; // Backwards compatibility alias
  totalTokensBurned: string;
  totalStars: string;

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

  // Graveyard Info
  graveyardSize: string;
  activeNFTs: string;

  // Contract Status
  isPaused: boolean;

  lastUpdated: number;
}

export const useContractStats = () => {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient();

  const fetchContractStats = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      // Fetch all stats in parallel for better performance
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
        graveyardSize,
        perPingCapDivisor,
        isPaused,
      ] = await Promise.all([
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'totalBurnedOCTAA',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'totalBurned',
        }),
        // publicClient.readContract({ address: GAME_ADDR, abi: CONTRACT_ABI, functionName: 'totalStars' }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'monthlyRewardPool',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'totalLockedForRewards',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'mainTreasury',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'getBreedCostCRA',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'rewardRatePerSecond',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'pingInterval',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'breedCooldown',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'graveyardCooldown',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'burnFeeBps',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'manualFloorPrice',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'monthlyUnlockPercentage',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'totalBurned',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'perPingCapDivisor',
        }),
        publicClient.readContract({
          address: GAME_ADDR,
          abi: CONTRACT_ABI,
          functionName: 'paused',
        }),
      ]);

      const totalTokensBurnedBigInt = toBigIntOrZero(totalTokensBurned);
      const burnedCount = Number(totalTokensBurnedBigInt);
      // Max NFTs is always 9,700 regardless of breeding (breeding revives from graveyard)
      const MAX_NFTS = 9700;
      const activeCount = Math.min(MAX_NFTS - burnedCount, MAX_NFTS);

      const totalOCTAABurnedFormatted = formatEther(toBigIntOrZero(totalOCTAABurned));

      const contractStats: ContractStats = {
        totalOCTAABurned: totalOCTAABurnedFormatted,
        totalCRAABurned: totalOCTAABurnedFormatted,
        totalTokensBurned: totalTokensBurnedBigInt.toString(),
        totalStars: '0',
        currentMonthlyPool: formatEther(toBigIntOrZero(currentMonthlyPool)),
        currentLockedPool: formatEther(toBigIntOrZero(currentLockedPool)),
        mainTreasury: formatEther(toBigIntOrZero(mainTreasury)),
        currentBreedCost: formatEther(toBigIntOrZero(currentBreedCost)),
        rewardRatePerSecond: formatEther(toBigIntOrZero(rewardRatePerSecond)),
        pingInterval: toBigIntOrZero(pingInterval).toString(),
        breedCooldown: toBigIntOrZero(breedCooldown).toString(),
        graveyardCooldown: toBigIntOrZero(graveyardCooldown).toString(),
        burnFeeBps: toBigIntOrZero(burnFeeBps).toString(),
        manualFloorPrice: formatEther(toBigIntOrZero(manualFloorPrice)),
        monthlyUnlockPercentage: toBigIntOrZero(monthlyUnlockPercentage).toString(),
        graveyardSize: toBigIntOrZero(graveyardSize).toString(),
        activeNFTs: activeCount.toString(),
        perPingCapDivisor: toBigIntOrZero(perPingCapDivisor).toString(),
        isPaused: Boolean(isPaused),
        lastUpdated: Date.now(),
      };

      setStats(contractStats);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch contract stats');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchContractStats();
  }, [fetchContractStats]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchContractStats, 120000);
    return () => clearInterval(interval);
  }, [fetchContractStats]);

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

  return {
    stats,
    isLoading,
    error,
    refresh: fetchContractStats,

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
  };
};
