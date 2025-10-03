import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { CRAZY_OCTAGON_CORE_ABI } from '@/lib/abi/crazyOctagon';

const GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GAME_PROXY as `0x${string}`;

export const useClaimBurnReward = (tokenId: string) => {
  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error,
  } = useWriteContract();

  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 2,
  });

  const claim = async () => {
    try {
      toast.loading('Sending transaction...', { id: `claim-${tokenId}` });
      await writeContractAsync({
        address: GAME_CONTRACT_ADDRESS,
        abi: CRAZY_OCTAGON_CORE_ABI,
        functionName: 'claimBurnRewards',
        args: [BigInt(tokenId)],
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Transaction failed';
      toast.error(errorMessage, {
        id: `claim-${tokenId}`,
      });
    }
  };

  return {
    claim,
    isClaiming: isPending || isTxLoading,
    isSuccess: isTxSuccess,
    error: error || txError,
  };
};