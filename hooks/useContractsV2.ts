import { useMemo } from 'react';
import { coreContractConfig, nftContractConfig } from '@/lib/contracts';
import { activeChain } from '@/config/chains';

/**
 * Универсальный хук: единая точка доступа к конфигам контрактов и chainId.
 * Все страницы/хуки должны импортировать только это, чтобы смена адресов
 * происходила централизованно через .env → config/chains.ts → activeChain.
 */
export function useContractsV2() {
  const core = useMemo(() => coreContractConfig, []);
  const nft = useMemo(() => nftContractConfig, []);
  const chainId = activeChain.id;

  return { core, nft, chainId } as const;
}