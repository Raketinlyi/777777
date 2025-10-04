/**
 * Multiple IPFS gateways for fallback (ordered by reliability)
 */
export const IPFS_GATEWAYS = [
  'https://nftstorage.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cf-ipfs.com/ipfs/',
  'https://ipfs.decentralized-content.com/ipfs/',
  'https://ipfs.runfission.com/ipfs/',
] as const;

/**
 * Tracks failed gateways to avoid retrying dead ones
 */
const failedGateways = new Set<string>();
let lastGatewayIndex = 0;

type GatewayStats = {
  successes: number;
  failures: number;
  lastSuccess: number | null;
};

const gatewayStats = new Map<string, GatewayStats>();

/**
 * Cache successful gateway URLs for each IPFS hash
 * Key: ipfsHash, Value: { url: string, timestamp: number }
 */
const successfulGatewayCache = new Map<string, { url: string; timestamp: number }>();
const GATEWAY_SUCCESS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Get cached successful gateway URL for an IPFS hash
 */
export function getCachedGatewayUrl(ipfsHash: string): string | null {
  const cached = successfulGatewayCache.get(ipfsHash);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > GATEWAY_SUCCESS_CACHE_TTL) {
    successfulGatewayCache.delete(ipfsHash);
    return null;
  }
  
  return cached.url;
}

/**
 * Cache a successful gateway URL for an IPFS hash
 */
export function cacheSuccessfulGateway(ipfsHash: string, url: string) {
  successfulGatewayCache.set(ipfsHash, { url, timestamp: Date.now() });

  const gateway = extractGateway(url);
  if (gateway) {
    const current = gatewayStats.get(gateway) ?? {
      successes: 0,
      failures: 0,
      lastSuccess: null,
    };

    gatewayStats.set(gateway, {
      successes: current.successes + 1,
      failures: current.failures,
      lastSuccess: Date.now(),
    });
  }
}

/**
 * Remove cached gateway URL for specific IPFS hash
 */
export function invalidateCachedGateway(ipfsHash: string) {
  successfulGatewayCache.delete(ipfsHash);
}

/**
 * Clear expired cache entries periodically (only in browser)
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [hash, data] of successfulGatewayCache.entries()) {
      if (now - data.timestamp > GATEWAY_SUCCESS_CACHE_TTL) {
        successfulGatewayCache.delete(hash);
      }
    }
  }, 60 * 1000); // Clean every minute
}

/**
 * Get next available IPFS gateway (round-robin with failure tracking)
 */
function getNextGateway(): string {
  const availableGateways = IPFS_GATEWAYS.filter(gw => !failedGateways.has(gw));

  if (availableGateways.length === 0) {
    failedGateways.clear();
    lastGatewayIndex = 0;
    return IPFS_GATEWAYS[0];
  }

  const scoredGateways = availableGateways
    .map(gateway => {
      const stats = gatewayStats.get(gateway);
      if (!stats) {
        return { gateway, score: 0 };
      }

      const successesScore = stats.successes * 5;
      const failuresPenalty = stats.failures * 3;
      const freshnessBoost = stats.lastSuccess
        ? Math.max(0, 5 - (Date.now() - stats.lastSuccess) / (60 * 1000)) * 2
        : 0;

      return {
        gateway,
        score: successesScore - failuresPenalty + freshnessBoost,
      };
    })
    .sort((a, b) => {
      if (b.score === a.score) {
        return availableGateways.indexOf(a.gateway) - availableGateways.indexOf(b.gateway);
      }
      return b.score - a.score;
    });

  const rankedGateway = scoredGateways[0]?.gateway;
  if (rankedGateway) {
    lastGatewayIndex = (lastGatewayIndex + 1) % availableGateways.length;
    return rankedGateway;
  }

  const fallbackGateway = availableGateways[lastGatewayIndex % availableGateways.length];
  lastGatewayIndex++;
  return fallbackGateway ?? IPFS_GATEWAYS[0];
}

function extractGateway(url: string): string | null {
  const directMatch = IPFS_GATEWAYS.find(gateway => url.startsWith(gateway));
  if (directMatch) {
    return directMatch;
  }

  try {
    const parsed = new URL(url);
    return IPFS_GATEWAYS.find(gateway => gateway.includes(parsed.hostname)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Mark gateway as failed (will be avoided for 3 minutes)
 */
export function markGatewayFailed(gateway: string) {
  failedGateways.add(gateway);
  const stats = gatewayStats.get(gateway) ?? {
    successes: 0,
    failures: 0,
    lastSuccess: null,
  };
  gatewayStats.set(gateway, {
    successes: stats.successes,
    failures: stats.failures + 1,
    lastSuccess: stats.lastSuccess,
  });
  // Drop cached entries that point to the failed gateway
  for (const [hash, data] of successfulGatewayCache.entries()) {
    if (data.url.startsWith(gateway)) {
      successfulGatewayCache.delete(hash);
    }
  }
  // Reset after 3 minutes
  setTimeout(() => failedGateways.delete(gateway), 3 * 60 * 1000);
}

/**
 * Converts IPFS URL to accessible HTTP URL through reliable gateway.
 * @param url - URL that can be in ipfs://... format or already be HTTP gateway link.
 * @returns - HTTP URL or fallback to favicon if all gateways fail.
 */
export function resolveIpfsUrl(
  url: string | undefined | null,
  opts: { webp?: boolean; width?: number } = {}
): string {
  if (!url) return '/icons/favicon-180x180.png';

  const { webp = true, width = 256 } = opts;
  
  // Helper to append cdn params
  const appendParams = (base: string): string => {
    if (!webp) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}format=webp&width=${width}`;
  };

  // Extract IPFS hash from various formats
  let ipfsHash: string | null = null;
  
  if (url.startsWith('ipfs://')) {
    ipfsHash = url.replace('ipfs://', '');
  } else {
    // Try to extract from gateway URL
    const ipfsRegex = /\/ipfs\/([A-Za-z0-9]+)(\/.*)?$/;
    const ipfsMatch = ipfsRegex.exec(url);
    if (ipfsMatch) {
      ipfsHash = ipfsMatch[1] + (ipfsMatch[2] || '');
    }
  }

  if (ipfsHash) {
    // Check cache first
    const cachedUrl = getCachedGatewayUrl(ipfsHash);
    if (cachedUrl) {
      return appendParams(cachedUrl);
    }

    // Use next available gateway with round-robin (cache only after successful load)
    const gateway = getNextGateway();
    const nextUrl = `${gateway}${ipfsHash}`;

    return appendParams(nextUrl);
  }

  // Not an IPFS URL - return as is with params
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return appendParams(url);
  }

  // Fallback to app icon for invalid URLs
  return '/icons/favicon-180x180.png';
}

/**
 * Get multiple IPFS URLs for fallback loading
 */
export function getIpfsUrls(ipfsHash: string): string[] {
  return IPFS_GATEWAYS.map(gateway => `${gateway}${ipfsHash}`);
}

/**
 * Resolve IPFS URL with fallback options (returns array of all gateways)
 */
export function resolveIpfsUrlWithFallback(
  url: string | undefined | null
): string[] {
  if (!url) return [];

  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    return getIpfsUrls(hash);
  }

  return [url];
}
