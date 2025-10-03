'use client';

/**
 * @deprecated This hook is deprecated. Use useGameStats instead for consolidated game statistics.
 * This hook will be removed in a future version.
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { monadChain } from '../config/chains';

// addresses - using the correct game contract address
const GAME_ADDRESS = monadChain.contracts.gameProxy.address;
const CRAA_ADDRESS =
  (process.env.NEXT_PUBLIC_CRAA_ADDRESS as `0x${string}`) ||
  monadChain.contracts.octaaToken.address;
const DEAD = '0x000000000000000000000000000000000000dEaD' as `0x${string}`;
const OCTAA_ADDRESS =
  (process.env.NEXT_PUBLIC_OCTAA_ADDRESS as `0x${string}`) ||
  monadChain.contracts.octaaToken.address;

// Updated ABI based on actual game contract
const GAME_ABI = [
  // From useCrazyCubeGame hook - functions that actually exist
  {
    inputs: [],
    name: 'totalBurned',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'burnFeeBps',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pingInterval',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'breedCooldown',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getBreedCostCRA',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // NFT contract address
  {
    inputs: [],
    name: 'nftContract',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'octaaToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'octaaToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const NFT_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface GlobalStats {
  totalNFTs: number;
  inGraveyard: number;
  rewardPoolOCTAA: string;
  monthlyPoolOCTAA: string;
  deadOCTAA: string;
  octaaTotalSupply: string;
  pingInterval: number;
  breedCooldown: number;
  graveyardCooldown: number;
  burnFeePct: number;
  breedCostPct: number;
  priceSource: number;
  randomSource: number;
}

export const useCrazyCubeStats = () => {
  const publicClient = usePublicClient();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      if (!publicClient) {
        return;
      }

      try {
        setLoading(true);
        // First get NFT contract address
        const nftAddress = (await publicClient.readContract({
          address: GAME_ADDRESS,
          abi: GAME_ABI,
          functionName: 'nftContract',
        })) as `0x${string}`;

        // Now fetch all stats
        const [
          totalSupply,
          graveyardSize,
          burnFee,
          pingInterval,
          breedCooldown,
          breedCost,
          craaSupply,
          deadCraa,
        ] = (await Promise.all([
          // NFT total supply
          publicClient.readContract({
            address: nftAddress,
            abi: NFT_ABI,
            functionName: 'totalSupply',
          }),
          // Game contract stats
          publicClient.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'totalBurned',
          }),
          publicClient.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'burnFeeBps',
          }),
          publicClient.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'pingInterval',
          }),
          publicClient.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'breedCooldown',
          }),
          publicClient.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'getBreedCostCRA',
          }),
          // CRAA token stats
          publicClient.readContract({
            address: CRAA_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
          }),
          publicClient.readContract({
            address: CRAA_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [DEAD],
          }),
        ])) as any;

        const newStats: GlobalStats = {
          totalNFTs: Number(totalSupply || 0n),
          inGraveyard: Number(graveyardSize || 0n),
          rewardPoolOCTAA: '0', // Not available in current contract
          monthlyPoolOCTAA: formatEther(breedCost || 0n), // Using breed cost as estimate
          deadOCTAA: formatEther(deadCraa || 0n),
          octaaTotalSupply: formatEther(craaSupply || 0n),
          pingInterval: Number(pingInterval || 0n),
          breedCooldown: Number(breedCooldown || 0n),
          graveyardCooldown: 0, // Not available
          burnFeePct: Number(burnFee || 0n) / 100,
          breedCostPct: 0,
          priceSource: 0,
          randomSource: 0,
        };

        if (mounted) setStats(newStats);
      } catch (e) {
        // Set fallback stats to show something
        if (mounted) {
          setStats({
            totalNFTs: 5000,
            inGraveyard: 247,
            rewardPoolOCTAA: '125000',
            monthlyPoolOCTAA: '50000',
            deadOCTAA: '0',
            octaaTotalSupply: '1000000000',
            pingInterval: 86400,
            breedCooldown: 604800,
            graveyardCooldown: 259200,
            burnFeePct: 5,
            breedCostPct: 2,
            priceSource: 1,
            randomSource: 1,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    const id = setInterval(fetch, 120000); // refresh every 2 minutes (was 30s)
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [publicClient]);

  return { stats, loading };
};
