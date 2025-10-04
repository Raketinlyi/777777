'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { NFT_CONTRACT_ADDRESS } from '@/config/wagmi';
import { nftAbi } from '@/config/abis/nftAbi';
import { resolveIpfsUrl } from '@/lib/ipfs';
import type { NFT, NFTMetadata } from '@/types/nft';

export function useNFTs() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get user's NFT balance
  const { data: balanceData } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Get user's tokens
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNFTsInChunks = async () => {
      if (!address || !isConnected || balanceData === undefined) {
        if (!isConnected) setNfts([]); // Clear NFTs if wallet is disconnected
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const balance = Number(balanceData);
        if (balance === 0) {
          setNfts([]);
          setIsLoading(false);
          return;
        }

        // --- APECHAIN FIX ---
        // Load NFTs in chunks to avoid one large request,
        // which causes errors on Monad Testnet RPC nodes.
        const CHUNK_SIZE = 20; // Configurable. Smaller = more requests, but smaller in size.
        let allFetchedNFTs: NFT[] = [];

        for (let i = 0; i < balance; i += CHUNK_SIZE) {
          if (signal.aborted) return;

          const chunkIndexPromises = [];
          const endIndex = Math.min(i + CHUNK_SIZE, balance);

          for (let j = i; j < endIndex; j++) {
            chunkIndexPromises.push(
              publicClient!.readContract({
                address: NFT_CONTRACT_ADDRESS,
                abi: nftAbi,
                functionName: 'tokenOfOwnerByIndex',
                args: [address, BigInt(j)],
              })
            );
          }

          const tokenIdsInChunk = (
            await Promise.all(chunkIndexPromises)
          ).filter(Boolean) as bigint[];
          if (signal.aborted) return;

          const tokenURIPromises = tokenIdsInChunk.map(tokenId =>
            publicClient!.readContract({
              address: NFT_CONTRACT_ADDRESS,
              abi: nftAbi,
              functionName: 'tokenURI',
              args: [tokenId],
            })
          );

          const tokenURIs = (await Promise.all(tokenURIPromises)).filter(
            Boolean
          ) as string[];
          if (signal.aborted) return;

          const metadataPromises = tokenURIs.map((uri, index) =>
            fetchMetadata(uri, Number(tokenIdsInChunk[index]), signal)
          );

          const fetchedChunk = (await Promise.all(metadataPromises)).filter(
            (nft): nft is NFT => nft !== null
          );

          allFetchedNFTs = [...allFetchedNFTs, ...fetchedChunk];

          // Update state after each chunk for UI responsiveness
          if (!signal.aborted) {
            setNfts([...allFetchedNFTs]);
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(
            err instanceof Error ? err : new Error('Failed to fetch NFTs')
          );
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchNFTsInChunks();

    // Cancel requests when leaving the page
    return () => {
      controller.abort();
    };
  }, [address, isConnected, balanceData, chain, publicClient]); // Add publicClient

  const fetchMetadata = async (
    tokenURI: string,
    tokenId: number,
    signal: AbortSignal
  ): Promise<NFT | null> => {
    try {
      const url = resolveIpfsUrl(tokenURI);
      if (!url.startsWith('https://')) {
        return null;
      }

      const response = await fetch(url, { signal });
      if (!response.ok)
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      const metadata: NFTMetadata = await response.json();

      return {
        id: `${tokenId}`,
        tokenId,
        name: metadata.name,
  image: metadata.image,
        attributes: metadata.attributes,
        rewardBalance: 0,
        frozen: false,
        rarity: 'Common', // Default rarity
      };
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
      }
      return null;
    }
  };

  return {
    nfts,
    isLoading,
    error,
  };
}
