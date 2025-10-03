'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useNetwork } from './use-network';

// Wallet context for real blockchain integration
interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number;
  nfts: NFT[];
  connect: () => void;
  disconnect: () => void;
}

export interface NFT {
  id: string;
  name: string;
  image: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  lastTransfer: Date;
  rewardBalance: number;
  frozen: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isMonadChain } = useNetwork();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [nfts, setNfts] = useState<NFT[]>([]);

  const connect = () => {
    setConnecting(true);
    // Here you would integrate with real wallet (WalletConnect, MetaMask, etc.)
    // For now, this is just a placeholder that shows connection state
    setTimeout(() => {
      setConnected(true);
      setPublicKey('0x1234...abcd'); // Real address would come from wallet
      setBalance(0); // Real balance would come from blockchain
      setNfts([]); // Real NFTs would come from blockchain/API
      setConnecting(false);
    }, 1000);
  };

  const disconnect = () => {
    setConnected(false);
    setPublicKey(null);
    setBalance(0);
    setNfts([]);
  };

  // Reset when network changes
  useEffect(() => {
    if (connected) {
      // Re-fetch wallet data when network changes
      // In real implementation, this would trigger wallet provider to switch networks
    }
  }, [isMonadChain, connected]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        balance,
        nfts,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
