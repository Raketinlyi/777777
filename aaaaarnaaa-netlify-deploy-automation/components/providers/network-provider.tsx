'use client';

import { useEffect, type ReactNode } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';

export function NetworkProvider({ children }: { children: ReactNode }) {
  // Load saved network preference on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('network-storage');
    if (savedNetwork) {
      try {
        const parsed = JSON.parse(savedNetwork);
        if (
          parsed.state &&
          ['mainnet', 'testnet', 'devnet'].includes(parsed.state.network)
        ) {
          useNetworkStore.setState({ network: parsed.state.network });
        }
      } catch {}
    }
  }, []);

  return <>{children}</>;
}
