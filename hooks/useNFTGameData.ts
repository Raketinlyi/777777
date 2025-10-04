'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { useCrazyOctagonGame } from './useCrazyOctagonGame';
import { monadChain } from '../config/chains';

import {
  CRAZY_OCTAGON_CORE_ABI,
  CRAZY_OCTAGON_READER_ABI,
} from '@/lib/abi/crazyOctagon';

// Import ABI and addresses from the main hook
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

const GAME_CONTRACT_ADDRESS = requireAddress(chainContracts.gameProxy, 'gameProxy');
const READER_CONTRACT_ADDRESS =
  chainContracts.reader?.address ??
  chainContracts.lpManager?.address ??
  requireAddress(chainContracts.gameProxy, 'gameProxy');

const GAME_CONTRACT_ABI = CRAZY_OCTAGON_CORE_ABI;
const READER_ABI = CRAZY_OCTAGON_READER_ABI;

export interface NFTGameInfo {
  tokenId: string;
  rarity: number;
  initialStars: number;
  currentStars: number;
  isActivated: boolean;
  gender?: number; // 1=male, 2=female
  lockedOcta: string;
  lockedOctaFormatted: string;
  lastPingTime: number;
  lastBreedTime: number;
  isInGraveyard: boolean;
  canPing: boolean;
  canBreed: boolean;
  pingCooldown: number;
  breedCooldown: number;
  breedUnlockAt?: number; // unix seconds timestamp read from contract (0 if none)
}

export interface BurnRecordInfo {
  tokenId: string;
  lockedAmount: string;
  lockedAmountFormatted: string;
  waitPeriod: number;
  waitPeriodHours: number;
  burnTime: number;
  claimed: boolean;
  canClaim: boolean;
  timeLeft: number;
  timeLeftFormatted: string;
}

// Hook to get information about one NFT
export const useNFTGameInfo = (tokenId: string | undefined) => {
  const enabled = !!tokenId;

  const {
    data: nftSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useReadContract({
    address: READER_CONTRACT_ADDRESS,
    abi: READER_ABI,
    functionName: 'getNFTSummary',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled },
  });

  const { data: nftBreedUnlockAt, refetch: refetchBreedUnlock } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'breedUnlockAt',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled },
  });

  const {
    data: nftMeta,
    isLoading: isLoadingMeta,
    error: metaError,
    refetch: refetchMeta,
  } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'meta',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled },
  });

  const { pingInterval, breedCooldown: globalBreedCooldown } = useCrazyOctagonGame();

  const formatNFTInfo = (): NFTGameInfo | null => {
    if (!nftSummary || !nftMeta || !tokenId) return null;

    const summary = nftSummary as readonly unknown[];
    const meta = nftMeta as readonly unknown[];
    const locked = (summary[9] as bigint) ?? 0n;

    const currentTime = Math.floor(Date.now() / 1000);
    const pingSec = pingInterval || 86400;
    const breedSec = globalBreedCooldown || 0;
    const lastPing = Number(summary[7] as number | bigint);
    const lastBreed = Number(summary[8] as number | bigint);
    const pingCooldown = Math.max(0, lastPing + pingSec - currentTime);

    // If contract provides breedUnlockAt timestamp, prefer it
    const unlockAt = nftBreedUnlockAt ? Number(nftBreedUnlockAt as bigint) : 0;
    const breedCooldown = unlockAt > 0
      ? Math.max(0, unlockAt - currentTime)
      : Math.max(0, lastBreed + breedSec - currentTime);

    const isActivated = Boolean(meta[3]);
    const inGraveyard = Boolean(summary[6]);
    const currentStars = Number(summary[4] as number | bigint);

    return {
      tokenId,
      rarity: Number(meta[0] as number | bigint),
      initialStars: Number(meta[1] as number | bigint),
      currentStars,
      isActivated,
      lockedOcta: locked.toString(),
      lockedOctaFormatted: formatEther(locked),
      lastPingTime: lastPing,
      lastBreedTime: lastBreed,
      isInGraveyard: inGraveyard,
      canPing: isActivated && !inGraveyard && pingCooldown === 0,
      canBreed:
        isActivated &&
        !inGraveyard &&
        currentStars > 0 &&
        breedCooldown === 0,
      pingCooldown,
      breedCooldown,
      breedUnlockAt: unlockAt,
    };
  };

  const refetch = () => {
    refetchSummary();
    refetchMeta();
    refetchBreedUnlock();
  };

  return {
    nftInfo: formatNFTInfo(),
    isLoading: isLoadingSummary || isLoadingMeta,
    error: summaryError ?? metaError,
    refetch,
  };
};

// Hook for getting information about burn record
export const useBurnRecord = (tokenId: string | undefined) => {
  const enabled = !!tokenId;

  const {
    data: burnRecord,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: READER_CONTRACT_ADDRESS,
    abi: READER_ABI,
    functionName: 'getBurnInfo',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled },
  });

  const formatBurnRecord = (): BurnRecordInfo | null => {
    if (!burnRecord || !tokenId) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    const summary = burnRecord as readonly unknown[];
    const waitMinutes = Number(summary[5] as number | bigint);
    const claimTime = Number(summary[2] as number | bigint);
    const timeLeft = Math.max(0, claimTime - currentTime);
    const isClaimed = Boolean(summary[4]);
    const canClaim = !isClaimed && timeLeft === 0 && Number(summary[1]) > 0;

    const formatTimeLeft = (seconds: number): string => {
      if (seconds === 0) return 'Ready!';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    return {
      tokenId,
      lockedAmount: ((summary[1] as bigint) ?? 0n).toString(),
      lockedAmountFormatted: formatEther((summary[1] as bigint) ?? 0n),
      waitPeriod: waitMinutes,
      waitPeriodHours: Math.max(1, Math.floor(waitMinutes / 60)),
      burnTime: claimTime,
      claimed: Boolean(summary[4]),
      canClaim,
      timeLeft,
      timeLeftFormatted: formatTimeLeft(timeLeft),
    };
  };

  return {
    burnRecord: formatBurnRecord(),
    isLoading,
    error,
    refetch,
  };
};

// Hook for getting information about multiple NFT
export const useMultipleNFTGameInfo = (tokenIds: string[]) => {
  const enabled = tokenIds.length > 0;

  // Prepare contracts for batch reading
  const summaryContracts = tokenIds.map(tokenId => ({
    address: READER_CONTRACT_ADDRESS,
    abi: READER_ABI,
    functionName: 'getNFTSummary',
    args: [BigInt(tokenId)],
  }));

  const metaContracts = tokenIds.map(tokenId => ({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'meta',
    args: [BigInt(tokenId)],
  }));

  const {
    data: nftSummaryResults,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useReadContracts({
    contracts: summaryContracts,
    query: { enabled },
  });

  // batch read breedUnlockAt for multiple tokens from GAME CONTRACT (not Reader)
  const unlockContracts = tokenIds.map(tokenId => ({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'breedUnlockAt',
    args: [BigInt(tokenId)],
  }));

  const { data: breedUnlockResults } = useReadContracts({
    contracts: unlockContracts,
    query: { enabled },
  });

  const {
    data: nftMetaResults,
    isLoading: isLoadingMeta,
    error: metaError,
    refetch: refetchMeta,
  } = useReadContracts({
    contracts: metaContracts,
    query: { enabled },
  });

  const { pingInterval, breedCooldown: globalBreedCooldown } =
    useCrazyOctagonGame();

  const formatMultipleNFTInfo = (): NFTGameInfo[] => {
    if (!nftSummaryResults || !nftMetaResults) return [];

    const currentTime = Math.floor(Date.now() / 1000);

    return tokenIds.flatMap((tokenId, index) => {
      const summaryResult = nftSummaryResults[index];
      const metaResult = nftMetaResults[index];

      if (
        !summaryResult ||
        !metaResult ||
        summaryResult.status !== 'success' ||
        metaResult.status !== 'success'
      ) {
        return [];
      }

      const summaryRaw = summaryResult.result;
      const metaRaw = metaResult.result;

      if (!Array.isArray(summaryRaw) || !Array.isArray(metaRaw)) {
        return [];
      }

      const summary = summaryRaw as readonly unknown[];
      const meta = metaRaw as readonly unknown[];

      const pingSec = pingInterval || 86400;
      const breedSec = globalBreedCooldown || 0;
      const lastPing = Number(summary[7] as number | bigint);
      const lastBreed = Number(summary[8] as number | bigint);
      const pingCooldown = Math.max(0, lastPing + pingSec - currentTime);

      // Attempt to read breedUnlockAt from batch results (if available)
      let breedCooldown = 0;
      if (breedUnlockResults?.[index]?.status === 'success') {
        const unlockVal = Number(breedUnlockResults[index].result as bigint);
        breedCooldown = unlockVal > 0 ? Math.max(0, unlockVal - currentTime) : Math.max(0, lastBreed + breedSec - currentTime);
      } else {
        breedCooldown = Math.max(0, lastBreed + breedSec - currentTime);
      }
      const locked = (summary[9] as bigint) ?? 0n;
      const currentStars = Number(summary[4] as number | bigint);
      const isActivated = Boolean(meta[3]);
      const inGraveyard = Boolean(summary[6]);
      const genderValue = Number(meta[2] as number | bigint);

      const info: NFTGameInfo = {
        tokenId,
        rarity: Number(meta[0] as number | bigint),
        initialStars: Number(meta[1] as number | bigint),
        currentStars,
        isActivated,
        lockedOcta: locked.toString(),
        lockedOctaFormatted: formatEther(locked),
        lastPingTime: lastPing,
        lastBreedTime: lastBreed,
        isInGraveyard: inGraveyard,
        canPing: isActivated && !inGraveyard && pingCooldown === 0,
        canBreed:
          isActivated &&
          !inGraveyard &&
          currentStars > 0 &&
          breedCooldown === 0,
        pingCooldown,
        breedCooldown,
        breedUnlockAt: breedUnlockResults?.[index]?.status === 'success' ? Number(breedUnlockResults[index].result as bigint) : 0,
        ...(Number.isFinite(genderValue) && genderValue > 0
          ? { gender: genderValue }
          : {}),
      };

      return [info];
    });
  };

  const refetch = () => {
    refetchSummary();
    refetchMeta();
  };

  return {
    nftInfos: formatMultipleNFTInfo(),
    isLoading: isLoadingSummary || isLoadingMeta,
    error: summaryError ?? metaError,
    refetch,
  };
};
