import { useAccount, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import { monadChain } from '@/config/chains';

export function useNetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);

  useEffect(() => {
    if (isConnected && chainId !== monadChain.id) {
      setNeedsNetworkSwitch(true);
    } else {
      setNeedsNetworkSwitch(false);
    }
  }, [isConnected, chainId]);

  return {
    needsNetworkSwitch,
    isConnected,
    currentChainId: chainId,
    requiredChainId: monadChain.id,
    isCorrectNetwork: chainId === monadChain.id,
  };
}
