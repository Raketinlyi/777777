import { usePublicClient, useChainId } from 'wagmi';
import { monadChain } from '../config/chains';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getRarityLabel, getRarityColor as rarityColor } from '@/lib/rarity';
import {
  CRAZY_OCTAGON_CORE_ABI,
  CRAZY_OCTAGON_READER_ABI,
} from '@/lib/abi/crazyOctagon';

const chainContracts = monadChain.contracts as Record<string, { address: `0x${string}` } | undefined>;

const requireAddress = (
  contract: { address: `0x${string}` } | undefined,
  label: string
): `0x${string}` => {
  if (!contract?.address) {
    throw new Error(`Missing ${label} contract address in monadChain config`);
  }
  return contract.address;
};

// Game contract addresses
const GAME_CONTRACT_ADDRESS = requireAddress(chainContracts.gameProxy, 'gameProxy');
const READER_CONTRACT_ADDRESS =
  chainContracts.reader?.address ??
  chainContracts.lpManager?.address ??
  requireAddress(chainContracts.gameProxy, 'gameProxy');

const GAME_CONTRACT_ABI = CRAZY_OCTAGON_CORE_ABI;
const READER_ABI = CRAZY_OCTAGON_READER_ABI;

export interface NFTStaticInfo {
  rarity: number;
  initialStars: number;
  gender: number; // 1 = мальчик, 2 = девочка
  isActivated: boolean;
}

export interface NFTDynamicInfo {
  currentStars: number;
  lockedOCTAA: bigint;
  lockedOcta: bigint;
  lastPingTime: bigint;
  lastBreedTime: bigint;
  isInGraveyard: boolean;
}

export interface NFTContractInfo {
  static: NFTStaticInfo;
  dynamic: NFTDynamicInfo;
}

export function useNFTContractInfo(tokenId: string | undefined) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const isMonadChain = chainId === monadChain.id;
  const [nftInfo, setNftInfo] = useState<NFTContractInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    const isValidId = tokenId !== undefined && /^\d+$/.test(tokenId);
    if (!publicClient || !isValidId || !isMonadChain) {
      if (isValidId && isMountedRef.current) {
        setIsLoading(true); // Show loading if ID exists but client is not ready yet
      } else if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Call data reading directly to bypass automatic multicall from wagmi
      const summaryPromise = publicClient.readContract({
        address: READER_CONTRACT_ADDRESS,
        abi: READER_ABI,
        functionName: 'getNFTSummary',
  args: [BigInt(tokenId)],
      });

      const metaPromise = publicClient.readContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: GAME_CONTRACT_ABI,
        functionName: 'meta',
  args: [BigInt(tokenId)],
      });

      const [nftSummary, nftMeta] = await Promise.all([
        summaryPromise,
        metaPromise,
      ]);

      if (!isMountedRef.current) return;

      const summaryArr = nftSummary as readonly unknown[];
      const metaArr = nftMeta as readonly unknown[];
      const locked = (summaryArr[9] as bigint) ?? 0n;

      const parsedInfo: NFTContractInfo = {
        static: {
          rarity: Number(metaArr[0] as number | bigint),
          initialStars: Number(metaArr[1] as number | bigint),
          gender: Number(metaArr[2] as number | bigint), // gender из контракта
          isActivated: Boolean(metaArr[3]),
        },
        dynamic: {
          currentStars: Number(summaryArr[4] as number | bigint),
          lockedOCTAA: locked,
          lockedOcta: locked,
          lastPingTime: BigInt(summaryArr[7] as number | bigint),
          lastBreedTime: BigInt(summaryArr[8] as number | bigint),
          isInGraveyard: Boolean(summaryArr[6]),
        },
      };
      setNftInfo(parsedInfo);
    } catch (e) {
      if (isMountedRef.current) {
        setError(e as Error);
        setNftInfo(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [tokenId, publicClient, isMonadChain]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Initial fetch
    fetchData();

    // Set up interval for periodic data updates only if we have valid data
    if (tokenId && publicClient && isMonadChain) {
      intervalId = setInterval(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tokenId, publicClient, isMonadChain, fetchData]);

  const refetch = useCallback(() => {
    // Don't reset data, just start loading again
    if (isMountedRef.current) {
      fetchData();
    }
  }, [fetchData]);

  // Functions for convenience
  const getRarityText = getRarityLabel;
  const getRarityColor = rarityColor;

  const getRarityByStars = (stars: number): string => {
    const map = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    return map[Math.min(Math.max(stars, 1), 6) - 1] || 'Common';
  };

  const getColorByStars = (stars: number): string => {
    switch (stars) {
      case 6:
        return 'bg-red-500';
      case 5:
        return 'bg-orange-500';
      case 4:
        return 'bg-purple-500';
      case 3:
        return 'bg-blue-500';
      case 2:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStarsBurnedCount = (): number => {
    if (!nftInfo) return 0;
    return nftInfo.static.initialStars - nftInfo.dynamic.currentStars;
  };

  const isNFTDead = (): boolean => {
    return (
      nftInfo?.dynamic.currentStars === 0 ||
      nftInfo?.dynamic.isInGraveyard ||
      false
    );
  };

  const getGenderIcon = (): string => {
    const gender = nftInfo?.static.gender || 1;
    return gender === 1 ? '♂️' : '♀️'; // 1 = мальчик, 2 = девочка
  };

  const getGenderText = (): string => {
    const gender = nftInfo?.static.gender || 1;
    return gender === 1 ? 'Мальчик' : 'Девочка';
  };

  return {
    // Data
    nftInfo,
    isLoading,
    error,
    refetch,

    // Utilities
    getRarityText,
    getRarityColor,
    getRarityByStars,
    getColorByStars,
    getStarsBurnedCount,
    isNFTDead,
    getGenderIcon,
    getGenderText,

    // Convenient getters
    rarity: nftInfo?.static.rarity || 0,
    currentStars: nftInfo?.dynamic.currentStars || 0,
    initialStars: nftInfo?.static.initialStars || 0,
    gender: nftInfo?.static.gender || 1, // по умолчанию мальчик
    isActivated: nftInfo?.static.isActivated || false,
    isInGraveyard: nftInfo?.dynamic.isInGraveyard || false,
    // Backwards-compatible aliases: some components expect `lockedOcta` while
    // contract currently exposes OCTAA locked amounts in this hook. Expose both.
    lockedOCTAA: nftInfo?.dynamic.lockedOCTAA || BigInt(0),
    lockedOcta: nftInfo?.dynamic.lockedOCTAA || BigInt(0),
  };
}
