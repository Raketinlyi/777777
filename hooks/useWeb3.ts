'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';

export function useWeb3() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);

  // Check that we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to format address
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Function to format amount
  const formatAmount = (
    amount: bigint | undefined,
    decimals = 18,
    precision = 2
  ) => {
    if (!amount) return '0';
    const formatted = formatEther(amount);
    const [whole, fraction] = formatted.split('.');
    if (!fraction) return whole;
    return `${whole}.${fraction.slice(0, precision)}`;
  };

  return {
    address,
    isConnected,
    isClient,
    connect,
    disconnect,
    connectors,
    isPending,
    formatAddress,
    formatAmount,
  };
}
