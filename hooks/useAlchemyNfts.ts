'use client';

import { useCallback } from 'react';
import type { NFT } from '@/types/nft';
import { useAlchemyNftsQuery } from './useAlchemyNftsQuery';

interface UseAlchemyNftsResult {
  nfts: NFT[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAlchemyNfts(): UseAlchemyNftsResult {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAlchemyNftsQuery();

  let normalizedError: Error | null = null;
  if (error) {
    normalizedError = error instanceof Error ? error : new Error(String(error));
  }

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    nfts: data ?? [],
    isLoading: isLoading || isFetching,
    error: normalizedError,
    refetch: handleRefetch,
  };
}
