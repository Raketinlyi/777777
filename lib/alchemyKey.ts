// Lightweight stub for client-side Wagmi initialization
// In this project we don't need Alchemy key management on the client.
// Keep an exported function to satisfy dynamic require('@@/lib/alchemyKey') in wagmi.ts

// Legacy no-op overload signature (kept for backward compatibility)
export function initWagmiClientLegacy(): void { /* no-op legacy */ }
// Advanced multi-tier API provider system with smart fallbacks

let lastIdx = -1;
const failedKeys = new Set<string>();
let lastResetTime = Date.now();
let currentTier = 0; // 0 = Alchemy, 1 = Public RPC, 2 = Wagmi

// Reset failed keys every 3 minutes (more aggressive to recover faster)
const RESET_INTERVAL = 3 * 60 * 1000;

// Track usage / failure stats per key for debugging and smarter rotation
const keyStats = new Map<
  string,
  { uses: number; fails: number; lastUsed: number }
>();

// Tier 1: Premium Alchemy endpoints (fastest, rate limited)
// Use ONLY environment variables (rotation across up to 5 keys). No hardcoded fallbacks.
const ALCHEMY_KEYS = [
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_1,
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_2,
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_3,
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_4,
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_5,
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_BREED,
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY, // optional single-key name
  // Accept optional typo prefix just in case the env was added that way in the dashboard
  // Optional typo-prefixed envs (defensively access via index signature)
  (process.env as Record<string, string | undefined>).XT_PUBLIC_ALCHEMY_API_KEY_1,
  (process.env as Record<string, string | undefined>).XT_PUBLIC_ALCHEMY_API_KEY_2,
  (process.env as Record<string, string | undefined>).XT_PUBLIC_ALCHEMY_API_KEY_3,
  
]
  .filter((key): key is string => typeof key === 'string' && key.length > 0)
  // Ensure uniqueness / stable order
  .filter((k, i, arr) => arr.indexOf(k) === i);

// Tier 2: Public RPC endpoints (slower but reliable)
const PUBLIC_RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_MONAD_RPC,
  process.env.MONAD_RPC,
  process.env.MONAD_RPC_2,
  process.env.MONAD_RPC_3,
  process.env.MONAD_RPC_4,
  process.env.MONAD_RPC_5,
  process.env.RPC_URL,
  'https://testnet-rpc.monad.xyz',
]
  .filter((url): url is string => typeof url === 'string' && url.length > 0)
  .filter((url, index, arr) => arr.indexOf(url) === index);

// Tier 3: Wagmi public client (slowest but always works)
type MinimalWagmiClient = {
  getBalance?: (args: { address: `0x${string}` }) => Promise<unknown>;
  call?: (args: { to: `0x${string}`; data: `0x${string}` }) => Promise<unknown>;
  getBlockNumber?: () => Promise<unknown>;
};
let wagmiPublicClient: MinimalWagmiClient | null = null;

export const getAlchemyKey = (): string => {
  // Reset failed keys periodically
  const now = Date.now();
  if (now - lastResetTime > RESET_INTERVAL) {
    failedKeys.clear();
    lastResetTime = now;
    currentTier = 0; // Reset to premium tier
  }

  // Use environment variables first, fallback to hardcoded keys
  const availableKeys = ALCHEMY_KEYS.filter(
    (k): k is string => typeof k === 'string' && !failedKeys.has(k)
  );

  // If no Alchemy keys available, escalate to public RPC
  if (availableKeys.length === 0) {
    if (currentTier === 0) {
      currentTier = 1;
    }
    // Return first available public RPC endpoint
    return PUBLIC_RPC_ENDPOINTS[0] || 'https://testnet-rpc.monad.xyz';
  }

  // Round-robin through available keys
  if (availableKeys.length === 0) {
    throw new Error('No available Alchemy keys');
  }

  lastIdx = (lastIdx + 1) % availableKeys.length;
  const selectedKey = availableKeys[lastIdx];

  if (!selectedKey) {
    throw new Error('No available Alchemy keys');
  }

  // Track usage statistics
  const stat = keyStats.get(selectedKey) || { uses: 0, fails: 0, lastUsed: 0 };
  stat.uses++;
  stat.lastUsed = now;
  keyStats.set(selectedKey, stat);

  return selectedKey;
};

// Mark a key as failed and escalate tier if needed
export const markKeyAsFailed = (key: string): void => {
  failedKeys.add(key);

  // If all Alchemy keys failed, escalate to public RPC
  const availableKeys = ALCHEMY_KEYS.filter(
    (k): k is string => typeof k === 'string' && !failedKeys.has(k)
  );

  if (availableKeys.length === 0 && currentTier === 0) {
    currentTier = 1;
  }

  // Update stats
  const stat = keyStats.get(key) || { uses: 0, fails: 0, lastUsed: 0 };
  stat.fails++;
  keyStats.set(key, stat);
};

// Get best available endpoint based on current tier
export const getBestEndpoint = (): {
  url: string;
  type: 'alchemy' | 'rpc' | 'wagmi';
} => {
  const now = Date.now();

  // Reset tier periodically
  if (now - lastResetTime > RESET_INTERVAL) {
    currentTier = 0;
  }

  // Tier 1: Try Alchemy
  if (currentTier === 0) {
    const key = getAlchemyKey();
    return {
      url: `https://monad-testnet.g.alchemy.com/v2/${key}`,
      type: 'alchemy',
    };
  }

  // Tier 2: Public RPC
  if (currentTier === 1) {
    const rpcIdx = Math.floor(Math.random() * PUBLIC_RPC_ENDPOINTS.length);
    return {
      url:
        PUBLIC_RPC_ENDPOINTS[rpcIdx] ||
        PUBLIC_RPC_ENDPOINTS[0] ||
        'https://testnet-rpc.monad.xyz',
      type: 'rpc',
    };
  }

  // Tier 3: Wagmi fallback
  return {
    url: 'wagmi-public-client',
    type: 'wagmi',
  };
};

// Initialize wagmi public client for emergency fallback
export const initWagmiClient = (client: MinimalWagmiClient) => {
  wagmiPublicClient = client ?? null;
  if (typeof window !== 'undefined') {
    (window as unknown as { __wagmi_public_client_ready?: boolean }).__wagmi_public_client_ready = true;
  }
};

// Ultra-smart fetch with multi-tier fallback
export const ultraSmartFetch = async (
  requestData: { [key: string]: unknown },
  options: RequestInit = {},
  maxRetries = 6
): Promise<unknown> => {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    const endpoint = getBestEndpoint();

    try {
      // Tier 3: Use wagmi public client
  if (endpoint.type === 'wagmi' && wagmiPublicClient) {
        // Handle different request types for wagmi
        if (requestData.method === 'eth_getBalance') {
          const params = requestData.params as string[];
          if (wagmiPublicClient.getBalance) {
            return await wagmiPublicClient.getBalance({
              address: params[0] as `0x${string}`,
            });
          }
          throw new Error('wagmi getBalance unavailable');
        }
        if (requestData.method === 'eth_call') {
          const params = requestData.params as Array<{ to: string; data: string }>;
          if (params[0] && params[0].to && params[0].data) {
            if (wagmiPublicClient.call) {
              return await wagmiPublicClient.call({
                to: params[0].to as `0x${string}`,
                data: params[0].data as `0x${string}`,
              });
            }
            throw new Error('wagmi call unavailable');
          }
        }
        if (requestData.method === 'eth_blockNumber') {
          if (wagmiPublicClient.getBlockNumber) {
            return await wagmiPublicClient.getBlockNumber();
          }
          throw new Error('wagmi getBlockNumber unavailable');
        }

        // For other methods, fall back to RPC
        currentTier = 1;
        continue;
      }

      // Tier 1 & 2: HTTP requests
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(requestData),
        ...options,
      });

      if (response.status === 429) {
        if (endpoint.type === 'alchemy') {
          markKeyAsFailed(getAlchemyKey());
        }
        currentTier = Math.min(currentTier + 1, 2);
        throw new Error(`Rate limited: ${response.status}`);
      }

      if (response.status >= 500) {
        if (endpoint.type === 'alchemy') {
          markKeyAsFailed(getAlchemyKey());
        }
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Log successful tier usage
      if (attempt > 0) {
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt <= maxRetries) {
        // Escalate tier on failure
        if (endpoint.type === 'alchemy') {
          currentTier = 1;
        } else if (endpoint.type === 'rpc') {
          currentTier = 2;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All provider tiers exhausted');
};

// Legacy compatibility functions
export const getAlchemyUrl = (endpoint: 'rpc' | 'nft' = 'rpc'): string => {
  const bestEndpoint = getBestEndpoint();

  if (bestEndpoint.type === 'alchemy') {
    return endpoint === 'rpc'
      ? bestEndpoint.url
      : bestEndpoint.url.replace('/v2/', '/nft/v3/');
  }

  // For non-Alchemy endpoints, return RPC URL
  return bestEndpoint.url;
};

export const smartAlchemyFetch = ultraSmartFetch;

// Get rotation statistics for debugging / monitoring
export const getRotationStats = () => {
  const stats = Array.from(keyStats.entries()).map(([key, s]) => ({
    key: key.slice(0, 8) + '...',
    uses: s.uses,
    fails: s.fails,
    lastUsed: new Date(s.lastUsed).toISOString(),
    failRate: s.uses ? ((s.fails / s.uses) * 100).toFixed(1) + '%' : '0%',
  }));

  return {
    currentTier,
    failedKeys: Array.from(failedKeys).map(k => k.slice(0, 8) + '...'),
    stats,
    lastResetTime: new Date(lastResetTime).toISOString(),
  };
};

/**
 * USAGE EXAMPLES:
 *
 * // Initialize wagmi client for Tier 3 fallback
 * import { createPublicClient, http } from 'viem'
 * import { monadChain } from '@/config/chains'
 *
 * const publicClient = createPublicClient({
 *   chain: monadChain,
 *   transport: http()
 * })
 * initWagmiClient(publicClient)
 *
 * // Ultra-smart fetch with 3-tier fallback
 * const result = await ultraSmartFetch({
 *   jsonrpc: '2.0',
 *   method: 'eth_getBalance',
 *   params: ['0x...', 'latest'],
 *   id: 1
 * })
 *
 * // Get best endpoint for manual requests
 * const endpoint = getBestEndpoint()
 * *
 * // Legacy compatibility
 * const url = getAlchemyUrl('rpc')
 * const response = await smartAlchemyFetch(requestData)
 */





