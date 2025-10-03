import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { monadChain } from '@/config/chains';
import { ALLOWED_CONTRACTS } from '@/config/allowedContracts';
import { toast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

/**
 * Safe contract write hook that ensures the user is on the correct chain
 * before allowing contract writes
 */
export function useSafeContractWrite() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, ...writeContractReturn } = useWriteContract();

  const safeWriteContract = useCallback(
    async (args: Parameters<typeof writeContract>[0]) => {
      // Check if wallet is connected
      if (!isConnected) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        return;
      }

      // Check if contract is allowed
      if (!ALLOWED_CONTRACTS.has(args.address.toLowerCase() as `0x${string}`)) {
        toast({
          title: 'Contract blocked',
          description: 'Attempt to write to an unknown contract',
          variant: 'destructive',
        });
        return;
      }

      // Check if on correct chain
      if (chainId !== monadChain.id) {
        toast({
          title: 'Wrong network',
          description: 'Switching to Monad Testnet...',
        });

        try {
          await switchChain({ chainId: monadChain.id });
          // Wait a bit for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          toast({
            title: 'Network switch failed',
            description: 'Please switch to Monad Testnet manually',
            variant: 'destructive',
          });
          return;
        }
      }

      // Proceed with the contract write
      return writeContract(args);
    },
    [isConnected, chainId, switchChain, writeContract]
  );

  return {
    writeContract: safeWriteContract,
    ...writeContractReturn,
  };
}
