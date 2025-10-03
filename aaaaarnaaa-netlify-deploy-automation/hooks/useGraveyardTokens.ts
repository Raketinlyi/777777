import { useEffect, useState, useRef } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { monadChain } from '../config/chains';
import { CRAZY_OCTAGON_READER_ABI } from '@/lib/abi/crazyOctagon';
import { onGlobalRefresh } from '@/lib/refreshBus';

const chainContracts = monadChain.contracts as Record<string, { address: `0x${string}` }>;
const READER_ADDR = (
  chainContracts.reader?.address ?? chainContracts.lpManager?.address ?? chainContracts.gameProxy!.address
) as `0x${string}`;

const CACHE_KEY = 'crazycube:graveyard:tokens';
const BASE_REFRESH_INTERVAL_MS = 45_000; // 45 sec base
const JITTER_MS = 2_000; // +/- jitter to de-sync clients

// Retry logic with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a network/rate-limit error that we should retry
  const msg = (error as unknown as { message?: string })?.message || '';
      const shouldRetry =
        error instanceof Error &&
        (msg.includes('Failed to fetch') ||
          msg.includes('Network request failed') ||
          msg.includes('HTTP request failed') ||
          msg.toLowerCase().includes('timeout') ||
          msg.toLowerCase().includes('429') ||
          msg.toLowerCase().includes('too many requests') ||
          msg.toLowerCase().includes('rate limit'));

      if (i === maxRetries || !shouldRetry) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }

  throw lastError;
}

export function useGraveyardTokens() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const retryBackoffRef = useRef(0);

  const publicClient = usePublicClient();
  const chainId = useChainId();
  const isMonadChain = chainId === monadChain.id;

  useEffect(() => {
    let mounted = true;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let unsub: (() => void) | null = null;

    const fetchTokensOnce = async () => {
      if (!publicClient || !isMonadChain) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setError(null);
        // Pull current window from reader contract (no subgraph)
        const firstWindow = (await withRetry(async () => {
          return (await publicClient.readContract({
            address: READER_ADDR,
            abi: CRAZY_OCTAGON_READER_ABI,
            functionName: 'viewGraveWindow',
            args: [0n, 50n],
          })) as readonly unknown[];
        })) ?? [];

        const totalGrave = Number((firstWindow[1] as bigint) ?? 0n);
        const initialIds = Array.isArray(firstWindow[0])
          ? (firstWindow[0] as bigint[]).map(id => id.toString())
          : [];

        const maxTokens = Math.min(totalGrave, 200);
        let finalTokens: string[] = initialIds.slice(0, maxTokens);
        let offset = finalTokens.length;

        while (offset < maxTokens) {
          const remaining = maxTokens - offset;
          if (remaining <= 0) break;
          const chunkSize = Math.min(remaining, 50);
          const window = (await withRetry(async () => {
            return (await publicClient.readContract({
              address: READER_ADDR,
              abi: CRAZY_OCTAGON_READER_ABI,
              functionName: 'viewGraveWindow',
              args: [BigInt(offset), BigInt(chunkSize)],
            })) as readonly unknown[];
          })) ?? [];

          const ids = Array.isArray(window[0])
            ? (window[0] as bigint[]).map(id => id.toString())
            : [];

          if (ids.length === 0) break;
          finalTokens.push(...ids);
          if (finalTokens.length > maxTokens) {
            finalTokens = finalTokens.slice(0, maxTokens);
          }
          offset = finalTokens.length;
        }

        if (mounted) {
          setTokens(finalTokens);
          setReady(finalTokens.length > 0);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), ids: finalTokens })
          );
          // reset backoff on success
          retryBackoffRef.current = 0;
        }
      } catch (e: unknown) {
        if (mounted) {
          // Handle timeout errors more gracefully
          const msg = (e as { message?: string })?.message || '';
          const errName = (e as { name?: string })?.name || '';
          const isTimeoutError =
            msg.toLowerCase().includes('timeout') ||
            errName === 'TimeoutError';

          const isRateLimited =
            msg.toLowerCase().includes('429') ||
            msg.toLowerCase().includes('too many requests') ||
            msg.toLowerCase().includes('rate limit');

          const errorMessage = isRateLimited
            ? 'Rate limited by RPC (429). Backing off...'
            : isTimeoutError
              ? 'Network timeout - please check your connection'
              : msg || 'Network connection failed';

          setError(errorMessage);

          // Try to load from cache on error
          if (tokens.length === 0) {
            try {
              const cachedRaw =
                typeof window !== 'undefined'
                  ? localStorage.getItem(CACHE_KEY)
                  : null;
              if (cachedRaw) {
                const cached = JSON.parse(cachedRaw) as {
                  ts: number;
                  ids: string[];
                };
                if (cached.ids?.length) {
                  setTokens(cached.ids);
                  setReady(cached.ids.length > 0);
                  }
              }
            } catch {
            }
          }

          // increase backoff window (cap at 2 minutes)
          retryBackoffRef.current = Math.min(
            retryBackoffRef.current ? retryBackoffRef.current * 2 : 5_000,
            120_000
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const scheduleNext = () => {
      const jitter = Math.floor(Math.random() * (2 * JITTER_MS + 1)) - JITTER_MS;
      const base = BASE_REFRESH_INTERVAL_MS;
      const backoff = retryBackoffRef.current || 0;
      const next = Math.max(5_000, base + jitter + backoff);
      refreshTimer = setTimeout(async () => {
        await fetchTokensOnce();
        scheduleNext();
      }, next);
    };

    // initial fetch and schedule
    fetchTokensOnce().then(scheduleNext);

    // subscribe for immediate refresh on txs
    unsub = onGlobalRefresh(() => {
      // immediate refetch and reschedule timer
      if (refreshTimer) clearTimeout(refreshTimer);
      fetchTokensOnce().then(scheduleNext);
    });
    return () => {
      mounted = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      if (unsub) unsub();
    };
  }, [publicClient, isMonadChain, tokens.length]);

  return { tokens, loading, error, ready };
}
