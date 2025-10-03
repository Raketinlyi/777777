'use client';

import { useEffect } from 'react';
import {
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  GAME_CONTRACT_ADDRESS,
} from '@/config/wagmi';
import { apeChain, monadChain } from '@/config/chains';

/**
 * Hardens window.ethereum by denying unsafe methods and suspicious txs.
 * – Blocks eth_sign (use EIP-712 typed data instead).
 * – Blocks eth_sendTransaction that sends value > 0 or goes to non-allowlisted address.
 * – Blocks wallet_addEthereumChain requests that don't match our known chain.
 */
export default function EthereumGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as { ethereum?: unknown }).ethereum) return;
    const eth = (window as { ethereum?: unknown }).ethereum as { 
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      __crazycube_guard_installed?: boolean;
    };

    if (eth.__crazycube_guard_installed) return;
    eth.__crazycube_guard_installed = true;

    // Build allowlist from known contracts and env-configured bridge addresses
    const envAddresses = [
      process.env.NEXT_PUBLIC_APE_ADAPTER,
      process.env.NEXT_PUBLIC_MONAD_MIRROR,
      process.env.NEXT_PUBLIC_CRAA_TOKEN,
      process.env.NEXT_PUBLIC_MONAD_CRAA_TOKEN,
      process.env.NEXT_PUBLIC_OCTAA_ADDRESS,
    ].filter((x): x is string => !!x && x.length === 42);

    const chainAddresses = [monadChain, apeChain]
      .map(chain =>
        Object.values(chain.contracts ?? {})
          .map(contract => {
            const address = (contract as { address?: string })?.address;
            return typeof address === 'string' && address.length === 42
              ? address.toLowerCase()
              : null;
          })
      )
      .flat()
      .filter((addr): addr is string => typeof addr === 'string');

    const allowlist = new Set<string>([
      NFT_CONTRACT_ADDRESS?.toLowerCase?.() || '',
      TOKEN_CONTRACT_ADDRESS?.toLowerCase?.() || '',
      GAME_CONTRACT_ADDRESS?.toLowerCase?.() || '',
      ...chainAddresses,
      ...envAddresses.map(a => a.toLowerCase()),
    ].filter(Boolean));

    const originalRequest = eth.request?.bind(eth);
    if (!originalRequest) return;

    eth.request = async (args: { method: string; params?: unknown[] }) => {
      const method = (args?.method || '').toLowerCase();
      const params = args?.params || [];

      // 1) Forbid legacy eth_sign (phishing-prone)
      if (method === 'eth_sign') {
        throw new Error('Blocked: legacy eth_sign is not allowed. Use EIP-712 typeddata_sign.');
      }

      // 2) Inspect raw transactions
      if (method === 'eth_sendtransaction' && params[0]) {
        const tx = params[0] as { to?: string; value?: string };
        const to = (tx.to || '').toLowerCase();
        const valueHex = tx.value || '0x0';
        const value = parseInt(valueHex, 16);

        const isAllowlisted = to && allowlist.has(to);
        const isZeroValue = !value || value === 0;

        // Block txs that are not to our contracts or try to transfer native value
        if (!isAllowlisted || !isZeroValue) {
          throw new Error('Blocked suspicious transaction: only zero-value calls to official contracts allowed from this dApp.');
        }
      }

      // 3) Restrict chain additions (optional)
      if (method === 'wallet_addethereumchain') {
        throw new Error('Blocked: adding arbitrary chains from this dApp is disabled.');
      }

      return originalRequest(args);
    };
  }, []);

  return null;
}