import { useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to handle wallet events like account/chain changes
 * Provides seamless background updates without page redirects
 */
export function useWalletEvents(options?: {
  onAccountChange?: () => void;
  onChainChange?: () => void;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();

  // Use refs to persist values between renders
  const previousAddressRef = useRef<string | undefined>(address);
  const previousChainIdRef = useRef<number | undefined>(chainId);

  useEffect(() => {
    // Account changed
    if (
      previousAddressRef.current &&
      address &&
      previousAddressRef.current !== address
    ) {
      toast({
        title: 'Account changed',
        description: 'Your wallet account has changed',
      });

      // Invalidate all queries to refresh data for new account
      queryClient.invalidateQueries();
      
      // Call custom callback if provided
      options?.onAccountChange?.();
    }

    // Chain changed
    if (
      previousChainIdRef.current &&
      chainId &&
      previousChainIdRef.current !== chainId
    ) {
      toast({
        title: 'Network changed',
        description: 'Your wallet network has changed',
      });

      // Invalidate all queries to refresh data for new chain
      queryClient.invalidateQueries();
      
      // Call custom callback if provided
      options?.onChainChange?.();
    }

    // Update refs with current values
    previousAddressRef.current = address;
    previousChainIdRef.current = chainId;
  }, [
    address,
    chainId,
    queryClient,
    options,
  ]);
}
