import { useEffect, useState } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { monadChain } from '@/config/chains';

const GAME_ADDR = monadChain.contracts.gameProxy.address as `0x${string}`;

// ABI for checking graveyard readiness
const GRAVEYARD_ABI = [
  {
    inputs: [],
    name: 'totalBurned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'graveyardTokens',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'burnRecords',
    outputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'totalAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'claimAvailableTime', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'graveyardReleaseTime',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'claimed', type: 'bool' },
      { internalType: 'uint8', name: 'waitPeriod', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Retry logic with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a network error that we should retry
      const shouldRetry =
        error instanceof Error &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed') ||
          error.message.includes('HTTP request failed') ||
          error.message.includes('timeout'));

      if (i === maxRetries || !shouldRetry) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }

  throw lastError;
}

export interface GraveyardReadiness {
  isReady: boolean;
  readyTokens: string[];
  totalTokens: number;
  timeUntilReady: number | null;
  loading: boolean;
  error: string | null;
}

export function useGraveyardReadiness(): GraveyardReadiness {
  const [isReady, setIsReady] = useState(false);
  const [readyTokens, setReadyTokens] = useState<string[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [timeUntilReady, setTimeUntilReady] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient();
  const chainId = useChainId();
  const isMonadChain = chainId === monadChain.id;

  useEffect(() => {
    let mounted = true;

    const checkGraveyardReadiness = async () => {
      if (!publicClient || !isMonadChain) {
        if (mounted) {
          setLoading(false);
          setError('No blockchain connection');
        }
        return;
      }

      try {
        setError(null);
        setLoading(true);

        // Get total number of burned NFTs with retry
        const totalBurned = await withRetry(async () => {
          return (await publicClient.readContract({
            address: GAME_ADDR,
            abi: GRAVEYARD_ABI,
            functionName: 'totalBurned',
          })) as bigint;
        });

        const total = Number(totalBurned);
        setTotalTokens(total);

        if (total === 0) {
          if (mounted) {
            setIsReady(false);
            setReadyTokens([]);
            setTimeUntilReady(null);
            setLoading(false);
          }
          return;
        }

        // Check first 50 tokens for readiness (for performance)
        const maxCheck = Math.min(total, 50);
        const now = Math.floor(Date.now() / 1000);
        let readyCount = 0;
        let earliestReadyTime: number | null = null;
        const currentReadyTokens: string[] = [];

        for (let i = 0; i < maxCheck; i++) {
          try {
            // Get tokenId from graveyard with retry
            const tokenId = await withRetry(async () => {
              return (await publicClient.readContract({
                address: GAME_ADDR,
                abi: GRAVEYARD_ABI,
                functionName: 'graveyardTokens',
                args: [BigInt(i)],
              })) as bigint;
            });

            if (tokenId > 0n) {
              // Get burn record with retry
              const burnRecord = await withRetry(async () => {
                return (await publicClient.readContract({
                  address: GAME_ADDR,
                  abi: GRAVEYARD_ABI,
                  functionName: 'burnRecords',
                  args: [tokenId],
                })) as any;
              });

              const graveyardReleaseTime = Number(
                burnRecord.graveyardReleaseTime || burnRecord[3]
              );

              if (graveyardReleaseTime <= now) {
                readyCount++;
                if (readyCount <= 10) {
                  // Limit number of ready tokens
                  currentReadyTokens.push(tokenId.toString());
                }
              } else {
                if (
                  earliestReadyTime === null ||
                  graveyardReleaseTime < earliestReadyTime
                ) {
                  earliestReadyTime = graveyardReleaseTime;
                }
              }
            }
          } catch (err) {
            // Continue with next token instead of failing completely
          }
        }

        if (mounted) {
          setIsReady(readyCount > 0);
          setReadyTokens(currentReadyTokens);
          setTimeUntilReady(earliestReadyTime ? earliestReadyTime - now : null);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          const errorMessage = err?.message?.includes('Failed to fetch')
            ? 'Network connection failed. Please check your internet connection.'
            : err?.message || 'Failed to check graveyard status';
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    checkGraveyardReadiness();

    // Check every 30 seconds
    const interval = setInterval(checkGraveyardReadiness, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [publicClient, isMonadChain]);

  return {
    isReady,
    readyTokens,
    totalTokens,
    timeUntilReady,
    loading,
    error,
  };
}
