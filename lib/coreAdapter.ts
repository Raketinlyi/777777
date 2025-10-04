import { coreContractConfig } from '@/lib/contracts';

export interface CoreClient {
  ping: (tokenId: bigint | number) => Promise<void>;
  burnNFT: (tokenId: bigint | number) => Promise<void>;
  requestBreed: (parent1Id: bigint | number, parent2Id: bigint | number) => Promise<void>;
}

/**
 * Минимальный адаптер: единые методы для вызовов.
 * Внутри можно расширить автодетект альтернативных имён функций,
 * чтобы при смене контракта не трогать страницы/хуки.
 */
export function createCoreClient(deps: {
  writeContract: (args: { address: `0x${string}`; abi: unknown; functionName: string; args?: unknown[] }) => Promise<unknown>;
}) {
  const { writeContract } = deps;
  const address = coreContractConfig.address;
  const abi = coreContractConfig.abi;

  const call = async (fn: string, args: unknown[] = []) => {
    await writeContract({ address, abi, functionName: fn, args });
  };

  const client: CoreClient = {
    ping: async (tokenId) => call('ping', [tokenId]),
    burnNFT: async (tokenId) => call('burnNFT', [tokenId]),
    requestBreed: async (a, b) => {
      // При необходимости добавить try/catch и альтернативные имена, например 'breed'.
      await call('requestBreed', [a, b]);
    },
  };

  return client;
}