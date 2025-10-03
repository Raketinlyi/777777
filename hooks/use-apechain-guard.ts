import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { apeChain } from '@/config/chains';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function useApeChainGuard() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const isApeChain = chainId === apeChain.id;

  // Auto-switch when wallet connects
  useEffect(() => {
    if (isConnected && !isApeChain) {
      // Small delay for stability
      const timer = setTimeout(() => {
        switchToApeChain();
      }, 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConnected, isApeChain]);

  // Try to switch to ApeChain
  const switchToApeChain = async () => {
    if (!switchChain) {
      toast({
        title: 'Switch Network',
        description: 'Please switch to ApeChain in your wallet!',
        variant: 'destructive',
      });
      return;
    }

    try {
      await switchChain({ chainId: apeChain.id });
      toast({
        title: 'Network Switched',
        description: 'Successfully switched to ApeChain!',
        variant: 'default',
      });
    } catch (e: any) {
      // If user declined the switch, show instruction
      if (e.code === 4001) {
        toast({
          title: 'Network Switch Required',
          description:
            'Please manually switch to ApeChain in your wallet to use this dApp!',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Switch Network',
          description: 'Please switch to ApeChain in your wallet!',
          variant: 'destructive',
        });
      }
    }
  };

  // Wrap any action to require ApeChain
  const requireApeChain =
    <T extends any[]>(action: (...args: T) => Promise<any> | void) =>
    async (...args: T) => {
      if (!isApeChain) {
        toast({
          title: 'Wrong Network',
          description: 'Switching to ApeChain...',
          variant: 'default',
        });
        await switchToApeChain();
        return;
      }
      return action(...args);
    };

  // Force switch with retry attempts
  const forceSwitchToApeChain = async (maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await switchToApeChain();
        if (isApeChain) break;
      } catch (e) {
        if (i === maxRetries - 1) {
          toast({
            title: 'Network Switch Failed',
            description: 'Please manually switch to ApeChain in your wallet!',
            variant: 'destructive',
          });
        }
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  return {
    isApeChain,
    requireApeChain,
    switchToApeChain,
    forceSwitchToApeChain,
  };
}
