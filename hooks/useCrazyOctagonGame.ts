'use client';

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useCallback } from 'react';
import { useGraveyardTokens } from './useGraveyardTokens';
import { monadChain } from '@/config/chains';
import { ALLOWED_CONTRACTS } from '@/config/allowedContracts';
import {
  CRAZY_OCTAGON_CORE_ABI,
  CRAZY_OCTAGON_READER_ABI,
  ERC20_ABI,
  ERC721_ABI,
} from '@/lib/abi/crazyOctagon';
import { triggerGlobalRefresh } from '@/lib/refreshBus';

const chainContracts = monadChain.contracts as Record<string, { address: `0x${string}` }>;
const GAME_CONTRACT_ADDRESS = chainContracts.gameProxy!.address as `0x${string}`;
const READER_CONTRACT_ADDRESS =
  (chainContracts.reader?.address ?? chainContracts.lpManager?.address ?? chainContracts.gameProxy!.address) as `0x${string}`;
const OCTA_TOKEN_ADDRESS =
  (chainContracts.octaToken?.address ?? chainContracts.crazyToken!.address) as `0x${string}`;
const OCTAA_TOKEN_ADDRESS =
  (chainContracts.octaaToken?.address ?? chainContracts.crazyToken!.address) as `0x${string}`;

const GAME_CONTRACT_ABI = CRAZY_OCTAGON_CORE_ABI;
const READER_ABI = CRAZY_OCTAGON_READER_ABI;
const OCTAA_TOKEN_ABI = ERC20_ABI;

const APE_CHAIN_ID = monadChain.id;

export interface NFTGameData {
  tokenId: string;
  rarity: number;
  initialStars: number;
  currentStars: number;
  isActivated: boolean;
  gender?: number; // 1=male, 2=female
  lockedOcta: string;
  lockedOctaWei: bigint;
  lastPingTime: number;
  lastBreedTime: number;
  isInGraveyard: boolean;
  bonusStars: number;
  dynBonusBps?: number; // Dynamic bonus from streak
  specBps?: number; // Special bonus
}

export interface BurnRecord {
  tokenId: string;
  lockedAmount: string;
  waitPeriod: number;
  burnTime: number;
  claimed: boolean;
  canClaim: boolean;
  timeLeft: number;
  claimAvailableTime?: number;
  graveyardReleaseTime?: number;
}

export type BurnWaitMinutes = 30 | 120 | 480;

const randomUint256 = (): bigint => {
  const cryptoSource =
    (typeof globalThis !== 'undefined' &&
      (globalThis.crypto ?? (globalThis as unknown as { crypto?: Crypto }).crypto)) ||
    undefined;

  if (!cryptoSource?.getRandomValues) {
    throw new Error('Secure randomness unavailable');
  }

  const bytes = new Uint8Array(32);
  cryptoSource.getRandomValues(bytes);
  return BigInt(
    `0x${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`
  );
};

const toFixedSafe = (value: string, decimals = 2): string => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : '0.00';
};

export const useCrazyOctagonGame = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  // no internal loading state required here

  // Use graveyard hook to inform front-end when cooldown is finished
  const { ready: graveyardReady } = useGraveyardTokens();

  // Write contract hook
  const {
    writeContractAsync,
    isPending: isWritePending,
    data: txHash,
    error: writeError,
  } = useWriteContract();

  // Transaction receipt
  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Read OCTAA balance
  const { data: octaaBalance, refetch: refetchOctaaBalance } = useReadContract({
    address: OCTAA_TOKEN_ADDRESS,
    abi: OCTAA_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 3, // Increased retry count
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5_000), // Faster retry
    },
  });

  // Read OCTA balance
  const { data: octaBalance } = useReadContract({
    address: OCTA_TOKEN_ADDRESS,
    abi: OCTAA_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 3, // Increased retry count
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5_000), // Faster retry
    },
  });

  // Read breed quote from reader contract (contains both OCTA + OCTAA costs)
  const { data: breedQuote } = useReadContract({
    address: READER_CONTRACT_ADDRESS,
    abi: READER_ABI,
    functionName: 'getBreedQuote',
    query: {
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 3, // Increased retry count
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5_000), // Faster retry
    },
  });

  const octaaCostRaw = breedQuote ? (breedQuote as readonly unknown[])[1] as bigint : 0n;
  const octaCostRaw = breedQuote ? (breedQuote as readonly unknown[])[0] as bigint : 0n;
  const lpFromOctaRaw = breedQuote ? (breedQuote as readonly unknown[])[2] as bigint : 0n;
  const sponsorFeeRaw = breedQuote ? (breedQuote as readonly unknown[])[4] as bigint : 0n;

  const breedCost = octaaCostRaw;
  const breedCostFormatted = (() => {
    try {
      return formatEther(octaaCostRaw);
    } catch {
      return '0.00';
    }
  })();
  const breedOctaCostFormatted = (() => {
    try {
      return formatEther(octaCostRaw);
    } catch {
      return '0.00';
    }
  })();
  const breedSponsorFeeFormatted = (() => {
    try {
      return formatEther(sponsorFeeRaw);
    } catch {
      return '0.00';
    }
  })();
  const breedLpContributionFormatted = (() => {
    try {
      return formatEther(lpFromOctaRaw);
    } catch {
      return '0.00';
    }
  })();

  // Read burn fee (in bps)
  const { data: burnFeeBpsData } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'burnFeeBps',
    query: {
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 10_000),
    },
  });
  const burnFeeBps = burnFeeBpsData ? Number(burnFeeBpsData) : 0;

  const { data: pingTimingData } = useReadContract({
    address: READER_CONTRACT_ADDRESS,
    abi: READER_ABI,
    functionName: 'getPingTiming',
    query: {
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 10_000),
    },
  });
  const pingInterval = pingTimingData ? Number((pingTimingData as readonly unknown[])[0]) : 0;
  const maxAccumulation = pingTimingData ? Number((pingTimingData as readonly unknown[])[1]) : 0;
  const sweepInterval = pingTimingData ? Number((pingTimingData as readonly unknown[])[2]) : 0;
  const monthDuration = pingTimingData ? Number((pingTimingData as readonly unknown[])[3]) : 0;

  const { data: graveyardCooldownData } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'graveyardCooldown',
    query: {
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 10_000),
    },
  });
  const graveyardCooldown = graveyardCooldownData ? Number(graveyardCooldownData) : 0;

  // Legacy compatibility: previous frontend expected a global breed cooldown; the
  // Monad core contract does not enforce one, so we expose zero seconds.
  const breedCooldown = 0;

  const { data: graveWindowData } = useReadContract({
    address: READER_CONTRACT_ADDRESS,
    abi: READER_ABI,
    functionName: 'viewGraveWindow',
    // always request a small non-zero window; total is returned separately
    args: [0n, 50n],
    query: {
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 10_000),
    },
  });
  const graveyardSizeRaw = graveWindowData
    ? ((graveWindowData as readonly unknown[])[1] as bigint)
    : 0n;

  const publicClient = usePublicClient();

  // Ability to switch chain automatically if wallet supports it
  const { switchChain } = useSwitchChain();

  const ensureNetwork = useCallback(async () => {
    if (chainId !== APE_CHAIN_ID) {
      try {
        await switchChain({ chainId: APE_CHAIN_ID });
        return true;
      } catch {
        // Consider showing a toast or modal to the user here
        throw new Error('Please switch to Monad Testnet.');
      }
    }
    return true;
  }, [chainId, switchChain]);

  // Get NFT game data
  const getNFTGameData = useCallback(
    async (tokenId: string): Promise<NFTGameData | null> => {
      if (!publicClient) return null;
      try {
        const id = BigInt(tokenId);
        const [summaryRaw, metaRaw] = (await Promise.all([
          publicClient.readContract({
            address: READER_CONTRACT_ADDRESS,
            abi: READER_ABI,
            functionName: 'getNFTSummary',
            args: [id],
          }),
          publicClient.readContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: GAME_CONTRACT_ABI,
            functionName: 'meta',
            args: [id],
          }),
        ])) as [readonly unknown[], readonly unknown[]];

        const locked = summaryRaw[9] as bigint;
        const genderValue = Number(metaRaw[2] as number | bigint);
        const result: NFTGameData = {
          tokenId,
          rarity: Number(metaRaw[0] as number | bigint),
          initialStars: Number(metaRaw[1] as number | bigint),
          isActivated: Boolean(metaRaw[3]),
          gender: genderValue === 1 || genderValue === 2 ? genderValue : 1, // Ensure valid gender (1 or 2)
          currentStars: Number(summaryRaw[4] as number | bigint),
          lockedOcta: formatEther(locked),
          lockedOctaWei: locked,
          lastPingTime: Number(summaryRaw[7] as number | bigint),
          lastBreedTime: Number(summaryRaw[8] as number | bigint),
          isInGraveyard: Boolean(summaryRaw[6]),
          bonusStars: Number(summaryRaw[5] as number | bigint),
          dynBonusBps: summaryRaw[10] ? Number(summaryRaw[10] as number | bigint) : 0,
          specBps: summaryRaw[11] ? Number(summaryRaw[11] as number | bigint) : 0,
        };

        return result;
      } catch {
        return null;
      }
    },
    [publicClient]
  );

  // Get burn record - updated for new contract structure
  const getBurnRecord = useCallback(
    async (tokenId: string): Promise<BurnRecord | null> => {
      if (!publicClient) return null;
      try {
        const data = (await publicClient.readContract({
          address: READER_CONTRACT_ADDRESS,
          abi: READER_ABI,
          functionName: 'getBurnInfo',
          args: [BigInt(tokenId)],
        })) as readonly unknown[];

        const now = Math.floor(Date.now() / 1000);
        const claimAt = Number(data[2] as number | bigint);
        const totalAmount = data[1] as bigint;

        const burnRecord: BurnRecord = {
          tokenId,
          lockedAmount: formatEther(totalAmount),
          waitPeriod: Number(data[5] as number | bigint),
          burnTime: claimAt,
          claimed: Boolean(data[4]),
          canClaim: !Boolean(data[4]) && now >= claimAt,
          timeLeft: Math.max(0, claimAt - now),
          claimAvailableTime: claimAt,
          graveyardReleaseTime: Number(data[3] as number | bigint),
        };

        return burnRecord;
      } catch {
        return null;
      }
    },
    [publicClient]
  );

  // Ping NFT
  const pingNFT = useCallback(
    async (tokenId: string) => {
      if (!writeContractAsync || !isConnected) {
        throw new Error('Wallet not connected');
      }
      // Contract allowlist enforcement
      if (!ALLOWED_CONTRACTS.has(GAME_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`)) {
        throw new Error('Blocked contract');
      }
      try {
        await ensureNetwork();
        const hash = await writeContractAsync({
          address: GAME_CONTRACT_ADDRESS,
          abi: GAME_CONTRACT_ABI,
          functionName: 'ping',
          args: [BigInt(tokenId)],
          gas: BigInt(300000),
        });
        // Wait for receipt and trigger global refresh
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        triggerGlobalRefresh('ping');
        return hash;
      } catch {
        throw new Error('pingNFT failed');
      }
    },
    [writeContractAsync, isConnected, ensureNetwork, publicClient]
  );

  // Burn NFT
  const burnNFT = useCallback(
    async (tokenId: string, waitMinutes: BurnWaitMinutes) => {
      if (!writeContractAsync || !isConnected) {
        throw new Error('Wallet not connected');
      }

      // Contract allowlist enforcement
      if (!ALLOWED_CONTRACTS.has(GAME_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`)) {
        throw new Error('Blocked contract');
      }
      try {
        await ensureNetwork();
        const hash = await writeContractAsync({
          address: GAME_CONTRACT_ADDRESS,
          abi: GAME_CONTRACT_ABI,
          functionName: 'burnNFT',
          args: [BigInt(tokenId), Number(waitMinutes)],
          gas: BigInt(500000),
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        triggerGlobalRefresh('burn');
        return hash;
      } catch {
        throw new Error('burnNFT failed');
      }
    },
    [writeContractAsync, isConnected, ensureNetwork, publicClient]
  );

  // Claim burn rewards
  const claimBurnRewards = useCallback(
    async (tokenId: string) => {
      if (!writeContractAsync || !isConnected) {
        throw new Error('Wallet not connected');
      }

      // Contract allowlist enforcement
      if (!ALLOWED_CONTRACTS.has(GAME_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`)) {
        throw new Error('Blocked contract');
      }
      try {
        await ensureNetwork();
        const hash = await writeContractAsync({
          address: GAME_CONTRACT_ADDRESS,
          abi: GAME_CONTRACT_ABI,
          functionName: 'claimBurnRewards',
          args: [BigInt(tokenId)],
          maxFeePerGas: BigInt('30000000000'), // 30 gwei
          maxPriorityFeePerGas: BigInt('1500000000'), // 1.5 gwei tip
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        triggerGlobalRefresh('claim');
        return hash;
      } catch {
        throw new Error('claimBurnRewards failed');
      }
    },
    [writeContractAsync, isConnected, ensureNetwork, publicClient]
  );

  // Breed NFTs
  const breedNFTs = useCallback(
    async (parent1Id: string, parent2Id: string) => {
      if (!writeContractAsync || !isConnected) {
        throw new Error('Wallet not connected');
      }

      // Contract allowlist enforcement
      if (!ALLOWED_CONTRACTS.has(GAME_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`)) {
        throw new Error('Blocked contract');
      }
      try {
        await ensureNetwork();
        const hash = await writeContractAsync({
          address: GAME_CONTRACT_ADDRESS,
          abi: GAME_CONTRACT_ABI,
          functionName: 'requestBreed',
          args: [
            BigInt(parent1Id),
            BigInt(parent2Id),
            randomUint256(),
          ],
          gas: BigInt(800000),
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        triggerGlobalRefresh('breed');
        return hash;
      } catch {
        throw new Error('breedNFTs failed');
      }
    },
    [writeContractAsync, isConnected, ensureNetwork, publicClient]
  );

  // Approve OCTAA tokens
  const approveOCTAA = useCallback(
    async (amount: string) => {
      if (!writeContractAsync || !isConnected) {
        throw new Error('Wallet not connected');
      }

      try {
        await ensureNetwork();
        // Add 10% buffer to amount to avoid shortage of pennies due to rounding
        const baseAmount = parseEther(amount);
        const bufferAmount = (baseAmount * BigInt(110)) / BigInt(100); // +10%
        // Enforce token allowlist
        if (!ALLOWED_CONTRACTS.has(OCTAA_TOKEN_ADDRESS.toLowerCase() as `0x${string}`)) {
          throw new Error('Blocked contract');
        }
        const hash = await writeContractAsync({
          address: OCTAA_TOKEN_ADDRESS,
          abi: OCTAA_TOKEN_ABI,
          functionName: 'approve',
          args: [GAME_CONTRACT_ADDRESS, bufferAmount],
          gas: BigInt(100000),
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        triggerGlobalRefresh('approve-octaa');
        return hash;
      } catch {
        throw new Error('approveNFT failed');
      }
    },
    [writeContractAsync, isConnected, ensureNetwork, publicClient]
  );

  const approveOCTA = useCallback(
    async (amount: string) => {
      if (!writeContractAsync || !isConnected) {
        throw new Error('Wallet not connected');
      }

      try {
        await ensureNetwork();
        const baseAmount = parseEther(amount);
        const bufferAmount = (baseAmount * BigInt(110)) / BigInt(100);
        if (!ALLOWED_CONTRACTS.has(OCTA_TOKEN_ADDRESS.toLowerCase() as `0x${string}`)) {
          throw new Error('Blocked contract');
        }
        const hash = await writeContractAsync({
          address: OCTA_TOKEN_ADDRESS,
          abi: OCTAA_TOKEN_ABI,
          functionName: 'approve',
          args: [GAME_CONTRACT_ADDRESS, bufferAmount],
          gas: BigInt(100000),
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        triggerGlobalRefresh('approve-octa');
        return hash;
      } catch {
        throw new Error('approveNFT failed');
      }
    },
    [writeContractAsync, isConnected, ensureNetwork, publicClient]
  );

  // Approve single NFT for the game contract
  const approveNFT = useCallback(
    async (tokenId: string) => {
      if (!writeContractAsync || !isConnected || !publicClient)
        throw new Error('Wallet not connected');

      // Read NFT contract address from game contract
      const nftAddress: `0x${string}` = (await publicClient.readContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: GAME_CONTRACT_ABI,
        functionName: 'nft',
      })) as `0x${string}`;

      // Enforce allowlist for target addresses
      if (!ALLOWED_CONTRACTS.has(GAME_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`)) {
        throw new Error('Blocked contract');
      }
      if (!ALLOWED_CONTRACTS.has(nftAddress.toLowerCase() as `0x${string}`)) {
        throw new Error('Blocked contract');
      }

      const hash = await writeContractAsync({
        address: nftAddress,
        abi: ERC721_ABI,
        functionName: 'approve',
        args: [GAME_CONTRACT_ADDRESS, BigInt(tokenId)],
        gas: BigInt(100000),
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      triggerGlobalRefresh('approve-nft');
      return hash;
    },
    [writeContractAsync, isConnected, publicClient]
  );

  // Get burn split for given wait minutes (12, 60, 255)
  const getBurnSplit = useCallback(
    async (waitMinutes: BurnWaitMinutes) => {
      if (!publicClient) return { playerBps: 0, poolBps: 0, burnBps: 0 };
      try {
        type BurnSplitStruct = readonly [bigint, bigint, bigint] | {
          playerBps: bigint; poolBps: bigint; burnBps: bigint;
        };
        const split = (await publicClient.readContract({
          address: GAME_CONTRACT_ADDRESS,
          abi: GAME_CONTRACT_ABI,
          functionName: 'burnSplits',
          args: [Number(waitMinutes)],
        })) as unknown as BurnSplitStruct;
        // struct BurnSplit { uint16 playerBps; uint16 poolBps; uint16 burnBps; }
        const isObj = (val: BurnSplitStruct): val is { playerBps: bigint; poolBps: bigint; burnBps: bigint } =>
          typeof val === 'object' && val !== null && 'playerBps' in (val as object);
        const player = isObj(split) ? split.playerBps : split[0];
        const pool = isObj(split) ? split.poolBps : split[1];
        const burn = isObj(split) ? split.burnBps : split[2];
        return {
          playerBps: Number(player as number | bigint),
          poolBps: Number(pool as number | bigint),
          burnBps: Number(burn as number | bigint),
        };
      } catch {
        return { playerBps: 0, poolBps: 0, burnBps: 0 };
      }
    },
    [publicClient]
  );

  // Get LP info for a given tokenId via reader contract
  const getLPInfo = useCallback(
    async (tokenId: string) => {
      if (!publicClient) return null;
      try {
        const data = (await publicClient.readContract({
          address: READER_CONTRACT_ADDRESS,
          abi: READER_ABI,
          functionName: 'getLPInfo',
          args: [BigInt(tokenId)],
        })) as readonly unknown[];

        // Expected tuple: [lpAmount, octaDeposited, pairDeposited, helper, pair]
        const lpAmount = data[0] as bigint;
        const octaDeposited = data[1] as bigint;
        const pairDeposited = data[2] as bigint;
        // helper and pair addresses are returned as items 3 and 4
        const helperAddress = (data[3] as string) ?? '';
        const pairAddress = (data[4] as string) ?? '';

        return {
          lpAmount: formatEther(lpAmount),
          lpAmountWei: lpAmount,
          octaDeposited: formatEther(octaDeposited),
          octaDepositedWei: octaDeposited,
          pairDeposited: formatEther(pairDeposited),
          pairDepositedWei: pairDeposited,
          helperAddress,
          pairAddress,
        };
      } catch {
        return null;
      }
    },
    [publicClient]
  );

  return {
    // State
    isConnected,
    address,
  // no internal isLoading

    // Contract data
    octaaBalance: octaaBalance ? formatEther(octaaBalance) : '0',
  octaBalance: octaBalance ? formatEther(octaBalance) : '0',
    breedCost: toFixedSafe(breedCostFormatted),
    breedCostWei: breedCost,
    breedOctaCost: toFixedSafe(breedOctaCostFormatted),
    breedOctaCostWei: octaCostRaw,
    breedSponsorFee: toFixedSafe(breedSponsorFeeFormatted),
    breedSponsorFeeWei: sponsorFeeRaw,
    breedLpContribution: toFixedSafe(breedLpContributionFormatted),
    breedLpContributionWei: lpFromOctaRaw,
    burnFeeBps,
    graveyardSize: Number(graveyardSizeRaw),

    // Transaction state
    isWritePending,
    isTxLoading,
    isTxSuccess,
    isTxError,
    txHash,
    writeError,
    txError,

    // Functions
    getNFTGameData,
    getBurnRecord,
    pingNFT,
    burnNFT,
    claimBurnRewards,
    breedNFTs,
    approveOCTAA,
    approveOCTA,
    approveNFT,
    getBurnSplit,
    refetchOctaaBalance,
  getLPInfo,

    // Contract addresses for external use
    GAME_CONTRACT_ADDRESS,
    OCTAA_TOKEN_ADDRESS,
    OCTA_TOKEN_ADDRESS,
    READER_CONTRACT_ADDRESS,
    GAME_CONTRACT_ABI,
    OCTAA_TOKEN_ABI,
    ERC721_ABI,
    READER_ABI,

    // Game parameters
    pingInterval,
    maxAccumulation,
    sweepInterval,
    monthDuration,
    breedCooldown,
    graveyardCooldown,

    // Graveyard readiness flag
    ready: graveyardReady,
  };
};

// Subscribe to global refresh events to refetch cached reads immediately
// Note: Hook subscriptions must be inside a React component/hook. The below is placed
// within the hook via useEffect to avoid SSR issues.
// (Global refresh handlers are consumed by other hooks like useGraveyardTokens/usePendingBurnRewards)
