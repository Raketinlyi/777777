'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import type { Abi } from 'viem';
import { monadChain } from '@/config/chains';

type NftSummaryTuple = readonly [
  `0x${string}`,
  boolean,
  boolean,
  number,
  number,
  number,
  boolean,
  number,
  number,
  bigint,
  number,
  number
];

export type NftBatchItem = {
  tokenId: string;
  success: boolean;
  data: NftSummaryTuple | null;
  error: Error | null;
};

/**
 * Хук для батчинга RPC запросов к контрактам
 * Использует multicall для объединения множественных запросов в один
 */

interface ContractCall {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

export function useContractBatch(
  calls: ContractCall[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['contract-batch', JSON.stringify(calls)],
    queryFn: async () => {
      if (!publicClient || calls.length === 0) return [];

      try {
        // Используем multicall для батчинга
        const results = await publicClient.multicall({
          contracts: calls.map(call => ({
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args,
          })),
          // Добавляем allowFailure для обработки ошибок отдельных вызовов
          allowFailure: true,
        });

        return results.map((result, index) => ({
          success: result.status === 'success',
          data: result.status === 'success' ? result.result : null,
          error: result.status === 'failure' ? result.error : null,
          call: calls[index],
        }));
      } catch (error) {
        console.error('Batch call error:', error);
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!publicClient && calls.length > 0,
    staleTime: options?.staleTime ?? 30_000, // 30 секунд по умолчанию
    gcTime: options?.gcTime ?? 5 * 60_000, // 5 минут
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Хук для получения глобальных данных контракта (sharePerPing, rarityBonuses и т.д.)
 * Использует Reader контракт для получения данных
 * Кэшируется на 1 минуту, так как эти данные меняются редко
 */
export function useContractGlobalData() {
  const publicClient = usePublicClient();
  const GAME_ADDR = monadChain.contracts.gameProxy.address;
  const READER_ADDR = monadChain.contracts.reader?.address ?? GAME_ADDR;

  // Reader ABI для получения глобальных данных
  const READER_ABI = [
    {
      type: 'function',
      name: 'getGlobalStats',
      stateMutability: 'view',
      inputs: [] as const,
      outputs: [
        { name: 'totalLocked', type: 'uint256', internalType: 'uint256' },
        { name: 'monthlyPool', type: 'uint256', internalType: 'uint256' },
        { name: 'claimReserve', type: 'uint256', internalType: 'uint256' },
        { name: 'sharePerPing_', type: 'uint256', internalType: 'uint256' },
        { name: 'safetyBps_', type: 'uint16', internalType: 'uint16' },
      ] as const,
    },
    {
      type: 'function',
      name: 'getPingTiming',
      stateMutability: 'view',
      inputs: [] as const,
      outputs: [
        { name: 'pingInterval_', type: 'uint256', internalType: 'uint256' },
        { name: 'maxAccumulation_', type: 'uint256', internalType: 'uint256' },
        { name: 'sweepInterval_', type: 'uint256', internalType: 'uint256' },
        { name: 'monthDuration_', type: 'uint256', internalType: 'uint256' },
      ] as const,
    },
  ] as const satisfies Abi;

  // Core ABI для получения rarityBonusBps
  const CORE_ABI = [
    {
      type: 'function',
      name: 'rarityBonusBps',
      stateMutability: 'view',
      inputs: [{ name: 'rarity', type: 'uint8', internalType: 'uint8' }] as const,
      outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }] as const,
    },
  ] as const satisfies Abi;

  return useQuery({
    queryKey: ['contract-global-data', READER_ADDR, GAME_ADDR],
    queryFn: async () => {
      if (!publicClient) return null;

      try {
        console.log('Fetching global data from Reader:', READER_ADDR, 'and Core:', GAME_ADDR);
        
        // Получаем данные через Reader и Core контрак��ы
        const contracts = [
          { address: READER_ADDR, abi: READER_ABI, functionName: 'getGlobalStats' },
          { address: READER_ADDR, abi: READER_ABI, functionName: 'getPingTiming' },
          ...Array.from({ length: 6 }, (_, i) => ({
            address: GAME_ADDR,
            abi: CORE_ABI,
            functionName: 'rarityBonusBps',
            args: [i + 1],
          })),
        ];

        const results = await publicClient.multicall({
          contracts,
          allowFailure: true,
        });

        console.log('Multicall results:', results);

        // Проверяем результаты
        const globalStatsResult = results[0];
        if (!globalStatsResult || globalStatsResult.status === 'failure') {
          console.error('getGlobalStats failed:', globalStatsResult);
          throw new Error('Failed to fetch global stats');
        }
        const pingTimingResult = results[1];
        if (!pingTimingResult || pingTimingResult.status === 'failure') {
          console.error('getPingTiming failed:', pingTimingResult);
          throw new Error('Failed to fetch ping timing');
        }

        const globalStats = globalStatsResult.result as readonly [bigint, bigint, bigint, bigint, number];
        const pingTiming = pingTimingResult.result as readonly [bigint, bigint, bigint, bigint];

        console.log('globalStats:', globalStats);
        console.log('pingTiming:', pingTiming);

        const getRarityBonus = (index: number) => {
          const result = results[index];
          if (!result || result.status !== 'success') {
            return 0n;
          }
          return BigInt(result.result as bigint);
        };

        const data = {
          sharePerPing: globalStats[3], // sharePerPing_ из getGlobalStats
          pingInterval: pingTiming[0], // pingInterval_ из getPingTiming
          maxAccumulation: pingTiming[1],
          sweepInterval: pingTiming[2],
          monthDuration: pingTiming[3],
          totalLocked: globalStats[0],
          monthlyPool: globalStats[1],
          claimReserve: globalStats[2],
          safetyBps: globalStats[4],
          rarityBonuses: {
            1: getRarityBonus(2),
            2: getRarityBonus(3),
            3: getRarityBonus(4),
            4: getRarityBonus(5),
            5: getRarityBonus(6),
            6: getRarityBonus(7),
          },
        };

        console.log('Global data fetched:', {
          sharePerPing: data.sharePerPing.toString(),
          pingInterval: data.pingInterval.toString(),
          rarityBonuses: Object.entries(data.rarityBonuses).map(([k, v]) => `${k}: ${v.toString()}`),
        });
        return data;
      } catch (error) {
        console.error('Global data fetch error:', error);
        throw error;
      }
    },
    enabled: !!publicClient,
    staleTime: 60_000, // 1 минута - эти данные меняются редко
    gcTime: 10 * 60_000, // 10 минут
    refetchOnWindowFocus: false,
    retry: 3,
  });
}

/**
 * Хук для получения данных множественных NFT за один запрос
 * Использует Reader контракт для эффективного получения данных
 */
export function useNFTsBatchData(tokenIds: string[]) {
  const publicClient = usePublicClient();
  const READER_ADDR = monadChain.contracts.reader?.address ?? monadChain.contracts.gameProxy.address;

  const READER_ABI = [
    {
      type: 'function',
      name: 'getNFTSummary',
      stateMutability: 'view',
      inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }] as const,
      outputs: [
        { internalType: 'address', name: 'owner', type: 'address' },
        { internalType: 'bool', name: 'exists', type: 'bool' },
        { internalType: 'bool', name: 'activated', type: 'bool' },
        { internalType: 'uint8', name: 'rarity', type: 'uint8' },
        { internalType: 'uint8', name: 'stars', type: 'uint8' },
        { internalType: 'uint8', name: 'bonusStars', type: 'uint8' },
        { internalType: 'bool', name: 'inGraveyard', type: 'bool' },
        { internalType: 'uint48', name: 'lastPingTime', type: 'uint48' },
        { internalType: 'uint48', name: 'lastBreedTime', type: 'uint48' },
        { internalType: 'uint256', name: 'lockedOcta', type: 'uint256' },
        { internalType: 'int16', name: 'dynBonusBps', type: 'int16' },
        { internalType: 'int16', name: 'specBps', type: 'int16' },
      ] as const,
    },
  ] as const satisfies Abi;

  return useQuery<NftBatchItem[]>({
    queryKey: ['nfts-batch-data', tokenIds.join(',')],
    queryFn: async () => {
      if (!publicClient || tokenIds.length === 0) return [];

      try {
        // Батчим запросы для всех NFT
        const results = await publicClient.multicall({
          contracts: tokenIds.map(tokenId => ({
            address: READER_ADDR,
            abi: READER_ABI,
            functionName: 'getNFTSummary',
            args: [BigInt(tokenId)],
          })),
          allowFailure: true,
        });

        return results.map((result, index): NftBatchItem => {
          let error: Error | null = null;
          if (result.status === 'failure') {
            if (result.error instanceof Error) {
              error = result.error;
            } else {
              error = new Error(String(result.error ?? 'Unknown error'));
            }
          }

          return {
            tokenId: tokenIds[index]!,
            success: result.status === 'success',
            data: result.status === 'success' ? (result.result as NftSummaryTuple) : null,
            error,
          };
        });
      } catch (error) {
        console.error('NFTs batch data error:', error);
        throw error;
      }
    },
    enabled: !!publicClient && tokenIds.length > 0,
    staleTime: 10_000, // 10 секунд - данные NFT обновляются чаще
    gcTime: 60_000, // 1 минута
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
