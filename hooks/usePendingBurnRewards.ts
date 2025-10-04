/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ContractFunctionExecutionError,
  ContractFunctionZeroDataError,
  isAddressEqual,
} from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CRAZY_OCTAGON_CORE_ABI as crazyOctagonCoreAbi,
  CRAZY_OCTAGON_READER_ABI as crazyOctagonReaderAbi,
} from '@/lib/abi/crazyOctagon';
import { monadChain } from '@/config/chains';
import { coreContractConfig } from '@/lib/contracts';
import { onGlobalRefresh } from '@/lib/refreshBus';

export interface BurnReward {
  tokenId: string;
  owner: `0x${string}`;
  totalAmount: string;
  playerAmount: string;
  poolAmount: string;
  burnedAmount: string;
  claimAt: number;
  graveReleaseAt: number;
  waitMinutes: number;
  claimed: boolean;
  isClaimable: boolean;
  playerBps: number;
  poolBps: number;
  burnBps: number;
  lpInfo: {
    helper: `0x${string}`;
    pair: `0x${string}`;
    lpAmount: string;
    octaDeposited: string;
    pairDeposited: string;
  } | null;
  hasLpPayout: boolean;
}

interface HookState {
  rewards: BurnReward[];
  loading: boolean;
  refreshing: boolean;
  paused: boolean | null;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
}

const BASE_REFRESH_INTERVAL_MS = 60_000;
const JITTER_MS = 2_000;
const CACHE_TTL_MS = 60_000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const CORE_ADDRESS = coreContractConfig.address;
const READER_ADDRESS = monadChain.contracts.reader.address;
// Production subgraph endpoints (priority order)
const PRODUCTION_SUBGRAPH_URLS = [
  'https://api.studio.thegraph.com/query/121684/octaa/v0.0.4',
  'https://gateway.thegraph.com/api/subgraphs/id/AnTbm7ijFdHSemsaECfNQ8onnc67T8zDrAB13wjMVq8B',
];

// Legacy fallbacks
const LEGACY_SUBGRAPH_FALLBACKS = [
  'https://api.studio.thegraph.com/query/111010/denis-3/v0.0.3',
];

const SUBGRAPH_CANDIDATES = [
  process.env.NEXT_PUBLIC_SUBGRAPH_URL,
  process.env.SUBGRAPH_URL,
  ...PRODUCTION_SUBGRAPH_URLS,
  ...LEGACY_SUBGRAPH_FALLBACKS,
]
  .map((value) => (typeof value === 'string' ? value.trim() : ''))
  .filter((value, index, array) => value && array.indexOf(value) === index);

let resolvedSubgraphUrl: string | null = null;

const readerUnsupportedByChain = new Map<number, boolean>();

const getReaderKey = (chainId?: number | null) => (typeof chainId === 'number' ? chainId : -1);

const isReaderMarkedUnsupported = (chainId?: number | null): boolean =>
  readerUnsupportedByChain.get(getReaderKey(chainId)) === true;

const markReaderUnsupported = (chainId?: number | null) => {
  readerUnsupportedByChain.set(getReaderKey(chainId), true);
};

const isReaderZeroDataError = (error: unknown): boolean => {
  if (error instanceof ContractFunctionZeroDataError) return true;
  if (error instanceof ContractFunctionExecutionError) {
    const short = error.shortMessage?.toLowerCase() ?? '';
    if (short.includes('returned no data') || short.includes('viewgravewindow')) {
      return true;
    }
    const causeMessage = (error.cause as Error | undefined)?.message?.toLowerCase() ?? '';
    if (causeMessage.includes('returned no data') || causeMessage.includes('viewgravewindow')) {
      return true;
    }
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('returned no data') || message.includes('viewgravewindow')) {
      return true;
    }
  }
  return false;
};

const isReaderFatalError = (error: unknown): boolean => {
  if (error instanceof ContractFunctionExecutionError) {
    const short = error.shortMessage?.toLowerCase() ?? '';
    if (
      short.includes('function selector was not recognized') ||
      (short.includes('execution reverted') && !short.includes('returned no data'))
    ) {
      return true;
    }
    const causeMessage = (error.cause as Error | undefined)?.message?.toLowerCase() ?? '';
    if (
      causeMessage.includes('function selector was not recognized') ||
      (causeMessage.includes('execution reverted') && !causeMessage.includes('returned no data'))
    ) {
      return true;
    }
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('function selector was not recognized')) return true;
    if (message.includes('execution reverted') && !message.includes('returned no data')) return true;
  }
  return false;
};

const normalizeCachedReward = (raw: unknown): BurnReward => {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (typeof value === 'bigint') return Number(value);
    return fallback;
  };

  const toString = (value: unknown, fallback = '0'): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
    if (typeof value === 'bigint') return value.toString();
    return fallback;
  };

  const claimAt = toNumber(record['claimAt']);
  const claimed = Boolean(record['claimed']);

  const lpRaw = record['lpInfo'];
  const lpRecord = typeof lpRaw === 'object' && lpRaw !== null ? (lpRaw as Record<string, unknown>) : null;
  const lpInfo = lpRecord
    ? {
        helper: toString(lpRecord['helper'], ZERO_ADDRESS) as `0x${string}`,
        pair: toString(lpRecord['pair'], ZERO_ADDRESS) as `0x${string}`,
        lpAmount: toString(lpRecord['lpAmount']),
        octaDeposited: toString(lpRecord['octaDeposited']),
        pairDeposited: toString(lpRecord['pairDeposited']),
      }
    : null;

  let hasLp = Boolean(record['hasLpPayout']);
  if (!hasLp && lpInfo) {
    try {
      hasLp = BigInt(lpInfo.lpAmount) > 0n;
    } catch {
      hasLp = false;
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const isClaimable = !claimed && now >= claimAt;

  return {
    tokenId: toString(record['tokenId'], '0'),
    owner: toString(record['owner'], ZERO_ADDRESS) as `0x${string}`,
    totalAmount: toString(record['totalAmount']),
    playerAmount: toString(record['playerAmount']),
    poolAmount: toString(record['poolAmount']),
    burnedAmount: toString(record['burnedAmount']),
    claimAt,
    graveReleaseAt: toNumber(record['graveReleaseAt']),
    waitMinutes: toNumber(record['waitMinutes']),
    claimed,
    isClaimable,
    playerBps: toNumber(record['playerBps']),
    poolBps: toNumber(record['poolBps']),
    burnBps: toNumber(record['burnBps']),
    lpInfo,
    hasLpPayout: hasLp,
  };
};

interface GraphToken {
  tokenId: string;
  totalAmount: string;
  claimAt: number;
  graveReleaseAt: number;
  waitMinutes: number;
  claimed: boolean;
}

const fetchFromSubgraph = async (address: `0x${string}`): Promise<GraphToken[]> => {
  const urls = resolvedSubgraphUrl
    ? [
        resolvedSubgraphUrl,
        ...SUBGRAPH_CANDIDATES.filter((candidate) => candidate !== resolvedSubgraphUrl),
      ]
    : SUBGRAPH_CANDIDATES;

  if (urls.length === 0) return [];

  const owner = address.toLowerCase();
  const query = `
    query Rewards($owner: String!) {
      tokens(
        where: { owner: $owner, isBurned: true }
        orderBy: burnedAt
        orderDirection: asc
      ) {
        id
        isClaimed
        burnEvent {
          totalAmount
          waitMinutes
          claimAvailableAt
          graveyardReleaseAt
        }
      }
    }
  `;

  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables: { owner } }),
      });

      if (!resp.ok) {
        throw new Error(`Subgraph error: ${resp.status}`);
      }

      const json = await resp.json();
      const tokens = json?.data?.tokens as any[] | undefined;
      if (!tokens) {
        resolvedSubgraphUrl = url;
        return [];
      }

      resolvedSubgraphUrl = url;

      return tokens
        .filter((token) => token?.burnEvent)
        .map((token) => {
          const burn = token.burnEvent;
          const claimAt = Number(burn?.claimAvailableAt ?? 0);
          const waitMinutes = Number(burn?.waitMinutes ?? 0);
          const graveReleaseAt = Number(burn?.graveyardReleaseAt ?? 0);
          return {
            tokenId: String(token.id ?? '0'),
            totalAmount: String(burn?.totalAmount ?? '0'),
            claimAt,
            graveReleaseAt,
            waitMinutes,
            claimed: Boolean(token.isClaimed),
          } as GraphToken;
        });
    } catch (error) {
      lastError = error;
      console.warn(`Subgraph fetch failed via ${url}`, error);
    }
  }

  if (lastError) {
    console.warn(
      'All configured subgraph endpoints failed',
      SUBGRAPH_CANDIDATES,
      lastError,
    );
  }

  return [];
};

const discoverTokenIdsViaReader = async (
  publicClient: ReturnType<typeof usePublicClient>,
  chainId?: number | null,
): Promise<string[]> => {
  const ids: string[] = [];
  if (!publicClient || isReaderMarkedUnsupported(chainId)) return ids;
  
  let offset = 0n;
  const MAX = 800n;
  const MAX_PAGES = 10; // Ограничение: только 10 страниц (8000 токенов макс)
  
  for (let i = 0; i < MAX_PAGES; i++) {
    try {
      const res = await publicClient.readContract({
        address: READER_ADDRESS,
        abi: crazyOctagonReaderAbi as any,
        functionName: 'viewGraveWindow',
        args: [offset, MAX],
      });
      const tuple = res as unknown as [readonly bigint[], bigint, bigint, number?];
      const chunk = tuple?.[0] ?? [];
      const cursor = tuple?.[2] ?? 0n;
      for (const id of chunk) ids.push(id.toString());
      if (cursor === 0n || chunk.length === 0) break;
      offset = cursor;
    } catch (error) {
      if (isReaderZeroDataError(error)) {
        console.warn('CrazyOctagon reader: viewGraveWindow returned no data, stopping enumeration');
        break;
      }
      if (isReaderFatalError(error)) {
        markReaderUnsupported(chainId);
        console.warn('CrazyOctagon reader unavailable, falling back to subgraph cache');
        break;
      }
      throw error;
    }
  }
  return [...new Set(ids)];
};

const loadRewardsFromReader = async (
  publicClient: ReturnType<typeof usePublicClient>,
  address: `0x${string}`,
  chainNow: number,
  chainId: number | null | undefined,
  tokenIds?: string[],
): Promise<BurnReward[]> => {
  if (!publicClient || isReaderMarkedUnsupported(chainId)) return [];

  const resolvedIds =
    tokenIds && tokenIds.length > 0
      ? [...new Set(tokenIds)]
      : await discoverTokenIdsViaReader(publicClient, chainId);

  if (resolvedIds.length === 0) return [];

  // Batching: делим на пачки по 50 токенов
  const BATCH_SIZE = 50;
  const rewards: BurnReward[] = [];

  for (let i = 0; i < resolvedIds.length; i += BATCH_SIZE) {
    const batch = resolvedIds.slice(i, i + BATCH_SIZE);
    const calls = batch.map((id) => ({
      address: READER_ADDRESS,
      abi: crazyOctagonReaderAbi as any,
      functionName: 'getBurnInfo',
      args: [BigInt(id)],
    }));

    const results = await publicClient.multicall({ contracts: calls as any, allowFailure: true });

    results.forEach((result, index) => {
      if (!result || result.status !== 'success') return;
      const data = result.result as unknown as [
        `0x${string}`,
        bigint,
        bigint,
        bigint,
        boolean,
        number,
        bigint,
        bigint,
        bigint,
      ];
      const owner = data?.[0];
      if (!isAddressEqual(owner, address)) return;
      const totalAmount = data?.[1] ?? 0n;
      const claimAt = Number(data?.[2] ?? 0n);
      const graveReleaseAt = Number(data?.[3] ?? 0n);
      const claimed = Boolean(data?.[4]);
      const waitMinutes = Number(data?.[5] ?? 0);
      const playerAmount = data?.[6] ?? 0n;
      const poolAmount = data?.[7] ?? 0n;
      const burnedAmount = data?.[8] ?? 0n;

      const tokenId = batch[index];
      if (!tokenId) return;

      rewards.push({
        tokenId,
        owner,
        totalAmount: totalAmount.toString(),
        playerAmount: playerAmount.toString(),
        poolAmount: poolAmount.toString(),
        burnedAmount: burnedAmount.toString(),
        claimAt,
        graveReleaseAt,
        waitMinutes,
        claimed,
        isClaimable: !claimed && chainNow >= claimAt,
        playerBps: 0,
        poolBps: 0,
        burnBps: 0,
        lpInfo: null,
        hasLpPayout: false,
      });
    });
  }

  return rewards;
};

export function usePendingBurnRewards(): HookState {
  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();

  const [rewards, setRewards] = useState<BurnReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const backoffRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  const cacheKey = useMemo(() => `${address ?? 'anon'}:pendingRewards`, [address]);

  const readCache = useCallback((): BurnReward[] | null => {
    if (typeof window === 'undefined' || !address) return null;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (!raw) return null;
      const cached = JSON.parse(raw) as { ts: number; data: BurnReward[] };
      if (Date.now() - cached.ts > CACHE_TTL_MS) return null;
      return cached.data.map(normalizeCachedReward);
    } catch {
      return null;
    }
  }, [address, cacheKey]);

  const writeCache = useCallback((data: BurnReward[]) => {
    if (typeof window === 'undefined' || !address) return;
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      /* ignore quota */
    }
  }, [address, cacheKey]);

  const fetchRewards = useCallback(async () => {
    if (!publicClient || !isConnected || !address) {
      if (mountedRef.current) {
        setRewards([]);
        setLastUpdated(null);
        setPaused(null);
      }
      return;
    }

    try {
      setError(null);

      let chainNow = Math.floor(Date.now() / 1000);
      const chainId = publicClient?.chain?.id ?? null;
      try {
        const block = await publicClient.getBlock();
        chainNow = Number(block.timestamp);
      } catch {}

      try {
        const pauseStatus = await publicClient.readContract({
          address: CORE_ADDRESS,
          abi: crazyOctagonCoreAbi as any,
          functionName: 'paused',
          args: [],
        });
        if (mountedRef.current) setPaused(Boolean(pauseStatus));
      } catch {
        if (mountedRef.current) setPaused(null);
      }

      let baseRewards: BurnReward[] = [];
      const seenIds = new Set<string>();

  // 1) Сначала пробуем субграф (если есть кандидаты URL)
  if (SUBGRAPH_CANDIDATES.length > 0) {
        try {
          const graphTokens = await fetchFromSubgraph(address);
          if (graphTokens.length > 0) {
            const ids = graphTokens.map((token) => token.tokenId);
            const readerData = await loadRewardsFromReader(publicClient, address, chainNow, chainId, ids);

            readerData.forEach((reward) => {
              seenIds.add(reward.tokenId);
              baseRewards.push(reward);
            });

            // Если вдруг Reader не вернул какие-то id, используем данные из субграфа как запасной вариант
            graphTokens.forEach((token) => {
              if (seenIds.has(token.tokenId)) return;
              seenIds.add(token.tokenId);
              baseRewards.push({
                tokenId: token.tokenId,
                owner: address,
                totalAmount: token.totalAmount,
                playerAmount: '0',
                poolAmount: '0',
                burnedAmount: '0',
                claimAt: token.claimAt,
                graveReleaseAt: token.graveReleaseAt,
                waitMinutes: token.waitMinutes,
                claimed: token.claimed,
                isClaimable: !token.claimed && chainNow >= token.claimAt,
                playerBps: 0,
                poolBps: 0,
                burnBps: 0,
                lpInfo: null,
                hasLpPayout: false,
              });
            });
          }
        } catch (err) {
          console.warn('Subgraph fetch failed', err);
        }
      }

      // 2) Fallback: Reader перечисление, если субграф ничего не дал
      if (baseRewards.length === 0) {
        baseRewards = await loadRewardsFromReader(publicClient, address, chainNow, chainId);
        baseRewards.forEach((reward) => seenIds.add(reward.tokenId));
      } else {
        // Подстрахуемся: вдруг в grave есть ещё id, которых нет в субграфе
        const extraIds = await discoverTokenIdsViaReader(publicClient, chainId);
        const missing = extraIds.filter((id) => !seenIds.has(id));
        if (missing.length > 0) {
          const extra = await loadRewardsFromReader(publicClient, address, chainNow, chainId, missing);
          extra.forEach((reward) => {
            seenIds.add(reward.tokenId);
            baseRewards.push(reward);
          });
        }
      }

      if (baseRewards.length === 0) {
        writeCache([]);
        if (mountedRef.current) {
          setRewards([]);
          setLastUpdated(Date.now());
        }
        backoffRef.current = 0;
        return;
      }

      // 3) burnSplits для подсказок процента
      const waitMinutesList = [...new Set(baseRewards.map((r) => r.waitMinutes).filter((n) => Number.isFinite(n) && n >= 0))];
      if (waitMinutesList.length > 0) {
        try {
          const splitCalls = waitMinutesList.map((wait) => ({
            address: CORE_ADDRESS,
            abi: crazyOctagonCoreAbi as any,
            functionName: 'burnSplits',
            args: [wait],
          }));
          const splitResults = await publicClient.multicall({ contracts: splitCalls as any, allowFailure: true });
          const splitMap = new Map<number, { playerBps: number; poolBps: number; burnBps: number }>();
          splitResults.forEach((result, index) => {
            if (!result || result.status !== 'success') return;
            const waitValue = waitMinutesList[index];
            if (typeof waitValue !== 'number') return;
            const tuple = result.result as readonly [number | bigint, number | bigint, number | bigint];
            const [playerBpsRaw, poolBpsRaw, burnBpsRaw] = tuple;
            splitMap.set(waitValue, {
              playerBps: Number(playerBpsRaw),
              poolBps: Number(poolBpsRaw),
              burnBps: Number(burnBpsRaw),
            });
          });

          baseRewards.forEach((reward) => {
            const split = splitMap.get(reward.waitMinutes);
            if (!split) return;
            reward.playerBps = split.playerBps;
            reward.poolBps = split.poolBps;
            reward.burnBps = split.burnBps;

            // Если суммы из Reader отсутствуют (например, пришли из Graph fallback), пересчитаем
            try {
              const total = BigInt(reward.totalAmount);
              if (reward.playerAmount === '0') {
                reward.playerAmount = ((total * BigInt(split.playerBps)) / 10_000n).toString();
              }
              if (reward.poolAmount === '0') {
                reward.poolAmount = ((total * BigInt(split.poolBps)) / 10_000n).toString();
              }
              if (reward.burnedAmount === '0') {
                reward.burnedAmount = ((total * BigInt(split.burnBps)) / 10_000n).toString();
              }
            } catch {}
          });
        } catch (err) {
          console.warn('Failed to load burn splits', err);
        }
      }

      // 4) LP информация
      try {
        const lpCalls = baseRewards.map((reward) => ({
          address: CORE_ADDRESS,
          abi: crazyOctagonCoreAbi as any,
          functionName: 'nftLP',
          args: [BigInt(reward.tokenId)],
        }));
        if (lpCalls.length > 0) {
          const lpResults = await publicClient.multicall({ contracts: lpCalls as any, allowFailure: true });
          lpResults.forEach((result, index) => {
            if (!result || result.status !== 'success') return;
            const reward = baseRewards[index];
            if (!reward) return;
            const tuple = result.result as readonly [
              `0x${string}`,
              `0x${string}`,
              bigint,
              bigint,
              bigint,
            ];
            const [helper, pair, lpAmount, octaDeposited, pairDeposited] = tuple;
            reward.lpInfo = {
              helper,
              pair,
              lpAmount: lpAmount.toString(),
              octaDeposited: octaDeposited.toString(),
              pairDeposited: pairDeposited.toString(),
            };
            reward.hasLpPayout = lpAmount > 0n;
          });
        }
      } catch (err) {
        console.warn('Failed to load LP info', err);
      }

      baseRewards.sort((a, b) => {
        if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
        if (a.isClaimable !== b.isClaimable) return a.isClaimable ? -1 : 1;
        return a.claimAt - b.claimAt;
      });

      writeCache(baseRewards);
      if (mountedRef.current) {
        setRewards(baseRewards);
        setLastUpdated(Date.now());
      }
      backoffRef.current = 0;
    } catch (err) {
      console.error('Failed to fetch burn rewards:', err);
      const message = (err as Error).message ?? 'Failed to fetch rewards';
      setError(message);
      const cached = readCache();
      if (cached && mountedRef.current) setRewards(cached);
      backoffRef.current = Math.min(60_000, Math.max(5_000, backoffRef.current ? backoffRef.current * 2 : 5_000));
    }
  }, [publicClient, isConnected, address, readCache, writeCache]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const jitter = Math.floor(Math.random() * (2 * JITTER_MS + 1)) - JITTER_MS;
    const delay = Math.max(5_000, BASE_REFRESH_INTERVAL_MS + jitter + (backoffRef.current || 0));
    timerRef.current = setTimeout(async () => {
      await fetchRewards();
      scheduleNext();
    }, delay);
  }, [fetchRewards]);

  const run = useCallback(async (showSpinner: boolean) => {
    if (!address || !isConnected) {
      if (mountedRef.current) {
        setRewards([]);
        setPaused(null);
        setLastUpdated(null);
      }
      return;
    }
    if (showSpinner) setLoading(true);
    try {
      const cached = readCache();
      if (showSpinner && cached) setRewards(cached);
      await fetchRewards();
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [address, isConnected, readCache, fetchRewards]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await run(true);
    } finally {
      setRefreshing(false);
    }
  }, [run]);

  useEffect(() => {
    mountedRef.current = true;
    run(true).then(() => scheduleNext());
    const unsubscribe = onGlobalRefresh(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      fetchRewards().then(() => scheduleNext());
    });
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (unsubscribe) unsubscribe();
    };
  }, [run, scheduleNext, fetchRewards]);

  return { rewards, loading, refreshing, paused, error, lastUpdated, refresh };
}
