/**
 * Converts IPFS URL to accessible HTTP URL through reliable gateway.
 * @param url - URL that can be in ipfs://... format or already be HTTP gateway link.
 * @returns - HTTP URL or original URL if it's not IPFS.
 */
export function resolveIpfsUrl(
  url: string | undefined | null,
  opts: { webp?: boolean; width?: number } = {}
): string {
  if (!url) return '';

  const { webp = true, width = 256 } = opts;
  // Helper to append cdn params
  const appendParams = (base: string): string => {
    if (!webp) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}format=webp&width=${width}`;
  };

  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    // Use public IPFS gateway (nftstorage is fast and reliable)
    return appendParams(`https://nftstorage.link/ipfs/${hash}`);
  }
  // If already using ipfs gateway – convert to Alchemy CDN for optimisation
  const ipfsMatch = url.match(/(?:https?:\/\/[^/]+\/ipfs\/)([A-Za-z0-9]+)(.*)/);
  if (ipfsMatch) {
    return appendParams(`https://nftstorage.link/ipfs/${ipfsMatch[1]}`);
  }
  // Fallback – just append params if same origin image
  return appendParams(url);
}

/**
 * Multiple IPFS gateways for fallback
 */
export const IPFS_GATEWAYS = [
  'https://nftstorage.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cf-ipfs.com/ipfs/',
] as const;

/**
 * Get multiple IPFS URLs for fallback loading
 */
export function getIpfsUrls(ipfsHash: string): string[] {
  return IPFS_GATEWAYS.map(gateway => `${gateway}${ipfsHash}`);
}

/**
 * Resolve IPFS URL with fallback options
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
