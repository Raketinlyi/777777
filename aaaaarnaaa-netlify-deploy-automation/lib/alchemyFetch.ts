import { getAlchemyKey, markKeyAsFailed } from './alchemyKey';
import { monadChain } from '@/config/chains';

/**
 * Advanced Alchemy fetch helper with smart key rotation:
 * 1) Picks an Alchemy API key via round-robin (getAlchemyKey)
 * 2) Retries on 429 / 5xx with exponential back-off, rotating key each time
 * 3) Marks failed keys to avoid reusing them
 * 4) Supports both RPC (v2) and NFT (v3) endpoints on Monad Testnet mainnet
 */
export async function alchemyFetch(
  endpoint: 'rpc' | 'nft',
  path: string, // the part after /v2/{key} or /nft/v3/{key}
  init?: RequestInit,
  maxRetries = 5
): Promise<Response> {
  let attempt = 0;
  let delayMs = 2000; // start 2s (increased from 1s)

  while (attempt <= maxRetries) {
    // Get a fresh key for each attempt to ensure rotation
    const key = getAlchemyKey();
    
    // Always use key-based URL for proper rotation
    const base = endpoint === 'nft'
      ? `https://monad-testnet.g.alchemy.com/nft/v3/${key}`
      : `https://monad-testnet.g.alchemy.com/v2/${key}`;
    
    const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          'Accept': 'application/json',
        },
      });
      
      if (res.status === 429) {
        // Rate limited - mark key as failed and retry with next key
        markKeyAsFailed(key);
        throw new Error(`Rate limited: ${res.status}`);
      }
      
      if (res.status >= 500) {
        // Server error - mark key as failed and retry
        markKeyAsFailed(key);
        throw new Error(`Server error: ${res.status}`);
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      return res;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      
      // Exponential backoff with jitter
      const jitter = Math.floor(Math.random() * 1000);
      await sleep(delayMs + jitter);
      delayMs = Math.min(delayMs * 2, 64000);
    }
  }
  // should never reach here
  throw new Error('alchemyFetch: exhausted retries');
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
