import { getAlchemyKey, markKeyAsFailed } from './alchemyKey';

/**
 * Advanced Alchemy fetch helper with smart key rotation:
 * 1) Picks an Alchemy API key via round-robin (getAlchemyKey)
 * 2) Retries on 429 / 5xx with exponential back-off, rotating key each time
 * 3) Marks failed keys to avoid reusing them
 * 4) Supports both RPC (v2) and NFT (v3) endpoints on Monad Testnet mainnet
 */
type AlchemyFetchOptions = {
  /** Preferred API key to try first (для отдельных потоков типа breeding) */
  preferredKey?: string;
  /** Закрепить выбор за preferredKey даже при ретраях */
  lockToPreferred?: boolean;
};

type PreferredState = {
  tried: boolean;
};

const buildAlchemyUrl = (endpoint: 'rpc' | 'nft', key: string, path: string): string => {
  const base = endpoint === 'nft'
    ? `https://monad-testnet.g.alchemy.com/nft/v3/${key}`
    : `https://monad-testnet.g.alchemy.com/v2/${key}`;

  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

const validateResponse = (response: Response, key: string): void => {
  if (response.status === 429) {
    markKeyAsFailed(key);
    throw new Error(`Rate limited: ${response.status}`);
  }

  if (response.status >= 500) {
    markKeyAsFailed(key);
    throw new Error(`Server error: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
};

const selectAlchemyKey = (
  preferredKey: string | undefined,
  state: PreferredState,
  lockToPreferred: boolean
): string => {
  if (preferredKey && (!state.tried || lockToPreferred)) {
    if (!lockToPreferred) {
      state.tried = true;
    }
    return preferredKey;
  }

  return getAlchemyKey();
};

export async function alchemyFetch(
  endpoint: 'rpc' | 'nft',
  path: string,
  init?: RequestInit,
  maxRetries = 5,
  options: AlchemyFetchOptions = {}
): Promise<Response> {
  let delayMs = 2000; // start 2s (increased from 1s)
  const normalizedPath = path.toLowerCase();
  const breedKeyCandidate =
    endpoint === 'nft' &&
    (normalizedPath.includes('getnftsforowner') || normalizedPath.includes('getnftmetadata'))
      ? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_BREED || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_5 || undefined
      : undefined;

  const preferredKey = options.preferredKey ?? breedKeyCandidate;
  const lockToPreferred = options.lockToPreferred ?? false;
  const preferredState: PreferredState = { tried: false };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const key = selectAlchemyKey(preferredKey, preferredState, lockToPreferred);
    const url = buildAlchemyUrl(endpoint, key, path);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Accept: 'application/json',
        },
      });

      validateResponse(response, key);
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const jitter = Math.floor(Math.random() * 1000);
      await sleep(delayMs + jitter);
      delayMs = Math.min(delayMs * 2, 64000);
    }
  }

  throw new Error('alchemyFetch: exhausted retries');
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
