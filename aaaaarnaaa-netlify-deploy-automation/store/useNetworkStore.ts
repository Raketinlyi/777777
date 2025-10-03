import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Network types
type NetworkType = 'mainnet' | 'testnet' | 'devnet';

interface NetworkState {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isMainnet: boolean;
  isTestnet: boolean;
  isDevnet: boolean;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      network: 'mainnet',
      setNetwork: (newNetwork: NetworkType) => {
        set({ network: newNetwork });
      },
      get isMainnet() {
        return get().network === 'mainnet';
      },
      get isTestnet() {
        return get().network === 'testnet';
      },
      get isDevnet() {
        return get().network === 'devnet';
      },
    }),
    {
      name: 'network-storage',
    }
  )
);
