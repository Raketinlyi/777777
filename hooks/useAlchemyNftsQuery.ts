'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { labelToIndex, getRarityLabel } from '@/lib/rarity';
import { alchemyFetch } from '@/lib/alchemyFetch';
import { resolveIpfsUrl } from '@/lib/ipfs';
import { hexToDecimal } from './useUserNFTs';
import rarityList from '@/public/cube_rarity.json';
import { monadChain } from '@/config/chains';
import type { NFT } from '@/types/nft';

interface AlchemyNft {
  tokenId: string;
  title?: string;
  raw?: {
    metadata?: {
      name?: string;
      image?: string;
      attributes?: Array<{ trait_type: string; value: any }>;
    };
  };
  image?: {
    cachedUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
  };
  media?: Array<{
    gateway?: string;
    raw?: string;
  }>;
}

const CRAZY_OCTAGON_READER_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'getNFTSummary',
    outputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'rewardBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'lastClaimTime', type: 'uint256' },
      { internalType: 'uint256', name: 'stars', type: 'uint256' },
      { internalType: 'uint256', name: 'level', type: 'uint256' },
      { internalType: 'bool', name: 'isInGraveyard', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useAlchemyNftsQuery() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Prefer legacy env name NEXT_PUBLIC_CRAZYCUBE_ADDRESS but fall back to
  // NEXT_PUBLIC_NFT_ADDRESS and finally to the configured chain contracts.
  const CRAZYCUBE_ADDR =
    process.env.NEXT_PUBLIC_CRAZYCUBE_ADDRESS ||
    process.env.NEXT_PUBLIC_NFT_ADDRESS ||
    (monadChain.contracts?.crazyCubeNFT?.address as string | undefined);

  const READER_ADDRESS =
    process.env.NEXT_PUBLIC_READER_ADDRESS ||
    process.env.NEXT_PUBLIC_LP_HELPER ||
    (monadChain.contracts?.reader?.address as string | undefined);

  const fetchNfts = async (): Promise<NFT[]> => {
    if (!isConnected || !address || !CRAZYCUBE_ADDR) {
      return [];
    }

    const allNFTs: NFT[] = [];
    let pageKey: string | undefined = undefined;
    const PAGE_SIZE = 100;
    let pageCount = 0;
    const MAX_PAGES = 20;

    do {
      pageCount++;
      if (pageCount > MAX_PAGES) {
        break;
      }

      try {
        let queryPath = `/getNFTsForOwner?owner=${address}&contractAddresses[]=${CRAZYCUBE_ADDR}&limit=${PAGE_SIZE}`;
        if (pageKey) {
          queryPath += `&pageKey=${encodeURIComponent(pageKey)}`;
        }

        // Add delay between requests to avoid 429 errors (increased to 500ms)
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await alchemyFetch('nft', queryPath, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }, 5);

        if (response.ok) {
          const data = await response.json();
          pageKey = data.pageKey;

          const items: NFT[] = (data.ownedNfts as AlchemyNft[]).map((nft: AlchemyNft) => {
            const metadata = nft.raw?.metadata;

            // Extract tokenId
            let tokenIdDec: number;
            let tokenIdStr: string | undefined;

            if (nft.tokenId) {
              tokenIdStr = nft.tokenId;
            } else if ((nft as any).id?.tokenId) {
              tokenIdStr = (nft as any).id.tokenId;
            } else if ((nft as any).id && typeof (nft as any).id === 'string') {
              tokenIdStr = (nft as any).id;
            }

            if (tokenIdStr) {
              if (/^\d+$/.test(tokenIdStr)) {
                tokenIdDec = Number(tokenIdStr);
              } else {
                const hexConverted = hexToDecimal(tokenIdStr);
                tokenIdDec = Number(hexConverted) || 0;
              }
            } else {
              const idFromNameMatch = (metadata?.name || nft.title || '').match(/#(\d+)/);
              tokenIdDec = idFromNameMatch ? Number(idFromNameMatch[1]) : 0;
            }

            // Get image from multiple possible sources
            const nftData = nft as any;
            const imageUrl =
              nftData.metadata?.image ||
              metadata?.image ||
              nftData.media?.[0]?.gateway ||
              nftData.image?.cachedUrl ||
              nftData.image?.thumbnailUrl ||
              nftData.image?.pngUrl ||
              '/icons/favicon-180x180.png';

            return {
              id: `${tokenIdDec}`,
              tokenId: tokenIdDec,
              name: metadata?.name || nft.title || `CrazyCube #${tokenIdDec}`,
              image: imageUrl,
              attributes: metadata?.attributes || [],
              rewardBalance: 0,
              frozen: false,
              stars: 0,
              rarity: 'Common',
            };
          });

          // Try to enrich NFTs that lack images
          const enriched = await Promise.all(
            items.map(async item => {
              if (item.image && item.image !== '/icons/favicon-180x180.png') return item;

              try {
                const metaPath = `/getNFTMetadata?contractAddress=${CRAZYCUBE_ADDR}&tokenId=${item.tokenId}`;
                await new Promise(resolve => setTimeout(resolve, 300));
                const metaRes = await alchemyFetch('nft', metaPath, {
                  method: 'GET',
                }, 3);
                if (!metaRes.ok) throw new Error('Failed to fetch metadata');

                const meta = await metaRes.json();
                if (meta.media && meta.media.length > 0) {
                  item.image = meta.media[0].gateway || meta.media[0].raw || item.image;
                }
                if (meta.rawMetadata?.image) {
                  item.image = meta.rawMetadata.image;
                }

                item.image = item.image || '/icons/favicon-180x180.png';
              } catch (e) {}

              return item;
            })
          );

          allNFTs.push(...enriched);

          // Get game state
          if (publicClient && READER_ADDRESS) {
            const enrichedWithGameState = await Promise.all(
              enriched.map(async item => {
                try {
                  // Check ownership first
                  const nftAddr: `0x${string}` = CRAZYCUBE_ADDR as `0x${string}`;
                  const owner: `0x${string}` = (await publicClient.readContract({
                    address: nftAddr,
                    abi: [
                      {
                        inputs: [
                          {
                            internalType: 'uint256',
                            name: 'tokenId',
                            type: 'uint256',
                          },
                        ],
                        name: 'ownerOf',
                        outputs: [
                          {
                            internalType: 'address',
                            name: '',
                            type: 'address',
                          },
                        ],
                        stateMutability: 'view',
                        type: 'function',
                      },
                    ],
                    functionName: 'ownerOf',
                    args: [BigInt(item.tokenId)],
                  })) as `0x${string}`;

                  if (owner.toLowerCase() !== address!.toLowerCase()) {
                    return null;
                  }

                  // Get game state
                  const summary = (await publicClient.readContract({
                    address: READER_ADDRESS as `0x${string}`,
                    abi: CRAZY_OCTAGON_READER_ABI,
                    functionName: 'getNFTSummary',
                    args: [BigInt(item.tokenId)],
                  })) as readonly unknown[];

                  const isInGraveyard = Boolean(summary[6]);
                  const currentStars = Number(summary[4] as number | bigint);

                  return {
                    ...item,
                    frozen: isInGraveyard,
                    stars: currentStars || item.stars,
                    isInGraveyard,
                  };
                } catch (e) {
                  return item;
                }
              })
            );

            return enrichedWithGameState.filter(Boolean) as NFT[];
          }

          return enriched;
        }
      } catch (alchemyError) {
        console.error('Alchemy error:', alchemyError);
      }

      // Fallback: our own proxy API
      try {
        const res = await fetch(`/api/alchemy/getNfts?owner=${address}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        const items: NFT[] = (json.ownedNfts as AlchemyNft[]).map((nft: AlchemyNft) => {
          const metadata = nft.raw?.metadata;
          const idFromNameMatch = (metadata?.name || nft.title || '').match(/#(\d+)/);

          let tokenIdDec: number;
          if (idFromNameMatch && idFromNameMatch[1]) {
            tokenIdDec = Number(idFromNameMatch[1]);
          } else {
            const hexConverted = hexToDecimal(nft.tokenId);
            tokenIdDec = Number(hexConverted) || 0;
          }

          return {
            id: `${tokenIdDec}`,
            tokenId: tokenIdDec,
            name: metadata?.name || nft.title || `CrazyCube #${tokenIdDec}`,
            image: (() => {
              const img =
                metadata?.image ||
                nft.image?.cachedUrl ||
                nft.image?.pngUrl ||
                '/icons/favicon-180x180.png';
              return resolveIpfsUrl(img);
            })(),
            attributes: metadata?.attributes || [],
            rewardBalance: 0,
            frozen: false,
            stars: 0,
            rarity: 'Common',
          };
        });

        return items;
      } catch (fallbackError) {
        console.error('Fallback API error:', fallbackError);
        throw fallbackError;
      }
    } while (pageKey);

    return allNFTs;
  };

  return useQuery({
    queryKey: ['alchemy-nfts', address, isConnected],
    queryFn: fetchNfts,
    enabled: isConnected && !!address,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}