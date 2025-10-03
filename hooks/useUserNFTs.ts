'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { resolveIpfsUrl } from '@/lib/ipfs';
import { alchemyFetch } from '@/lib/alchemyFetch';

export interface AlchemyNFT {
  contract: {
    address: string;
  };
  id: {
    tokenId: string;
    tokenMetadata?: {
      tokenType: string;
    };
  };
  balance: string;
  title: string;
  description: string;
  tokenUri: {
    gateway: string;
    raw: string;
  };
  media: Array<{
    gateway: string;
    thumbnail: string;
    raw: string;
    format: string;
    bytes?: number;
  }>;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: any;
    }>;
  };
  timeLastUpdated: string;
  contractMetadata: {
    name: string;
    symbol: string;
    tokenType: string;
  };
  spamInfo?: {
    isSpam: boolean;
    classifications: string[];
  };
}

export interface UseUserNFTsReturn {
  nfts: AlchemyNFT[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CONTRACT_ADDRESSES = [
  '0x606a47707d5aEdaE9f616A6f1853fE3075bA740B', // NFT contract address (40 characters)
  // Add other contract addresses if needed
];

// Helper functions for working with tokenId
// Convert a tokenId that may be in hex (padded 0x… or raw hex) OR already decimal
// to its plain decimal string form.
export const hexToDecimal = (value: string): string => {
  if (!value) return '';
  // If already looks like plain decimal, just return
  if (/^\d+$/.test(value)) return value;

  try {
    const clean = value.startsWith('0x') ? value.slice(2) : value;
    return BigInt('0x' + clean).toString();
  } catch {
    return '';
  }
};

export const decimalToHex = (decimal: string): string => {
  return '0x' + parseInt(decimal, 10).toString(16).padStart(64, '0');
};

// Function to get tokenId in decimal format
export const getTokenIdAsDecimal = (nft: any): string => {
  // 1) Try to extract ID from name/title (e.g. "CrazyCube #3430")
  const nameField = nft.metadata?.name || nft.title || nft.name || '';
  const match = nameField.match(/#(\d+)/);
  if (match && match[1]) {
    return match[1];
  }

  // 2) Check if tokenId is already a string (from useAlchemyNfts)
  if (nft.tokenId && typeof nft.tokenId === 'string') {
    const dec = hexToDecimal(nft.tokenId);
    return dec || nft.tokenId; // Return original if conversion fails
  }

  // 3) Fallback: hex from Alchemy id -> decimal (if present)
  if (nft.id?.tokenId) {
    const dec = hexToDecimal(nft.id.tokenId);
    return dec || '';
  }

  // 4) Last resort – empty string (so UI shows "#" or hides number)
  return '';
};

// Function to get NFT image
export const getNFTImage = (nft: AlchemyNFT): string => {
  let imageUrl = '';

  // Check media array
  if (nft.media && nft.media.length > 0 && nft.media[0]) {
    imageUrl = nft.media[0].gateway || nft.media[0].raw;
  }

  // If not in media, check metadata
  if (!imageUrl && nft.metadata?.image) {
    imageUrl = nft.metadata.image;
  }

  return resolveIpfsUrl(imageUrl);
};

// Function to get NFT name
export const getNFTName = (
  nft: AlchemyNFT | { id: { tokenId: string } }
): string => {
  // Handle different NFT object structures
  if ('title' in nft || 'metadata' in nft) {
    return (
      (nft as AlchemyNFT).title ||
      (nft as AlchemyNFT).metadata?.name ||
      `Token #${getTokenIdAsDecimal(nft as any)}`
    );
  }

  // For simple objects with just tokenId
  return `Token #${getTokenIdAsDecimal(nft as any)}`;
};

export function useUserNFTs(): UseUserNFTsReturn {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<AlchemyNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchNFTs = async () => {
    if (!address || !isConnected) {
      setNfts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query string manually to keep 'contractAddresses[]' without URL-encode.
      const parts: string[] = [
        `owner=${address}`,
        'withMetadata=true',
        'pageSize=100',
      ];
      CONTRACT_ADDRESSES.forEach(addr => {
        parts.push(`contractAddresses[]=${addr}`);
      });
      const queryPath = `/getNFTsForOwner?${parts.join('&')}`;

      // Use alchemyFetch with automatic key rotation and retry logic
      const response = await alchemyFetch('nft', queryPath, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Alchemy API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const userNFTs: AlchemyNFT[] = data.ownedNfts || [];

      // Try to enrich NFTs that lack media/image via getNFTMetadata
      const enriched = await Promise.all(
        userNFTs.map(async (item: AlchemyNFT) => {
          const hasImage = getNFTImage(item) !== '';
          if (hasImage) return item;
          try {
            if (!item.id?.tokenId) return item;
            const metaPath = `/getNFTMetadata?contractAddress=${item.contract.address}&tokenId=${hexToDecimal(item.id.tokenId)}`;
            const metaRes = await alchemyFetch('nft', metaPath, {
              method: 'GET',
            });
            if (!metaRes.ok) throw new Error('meta');
            const meta = await metaRes.json();
            // merge metadata/media fields if present
            if (meta.rawMetadata) {
              item.metadata = meta.rawMetadata;
            }
            if (meta.media && Array.isArray(meta.media) && meta.media.length) {
              item.media = meta.media;
            }
          } catch (e) {}
          return item;
        })
      );

      setNfts(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address, isConnected]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs,
  };
}
