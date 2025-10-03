import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { NFT_CONTRACT_ADDRESS, MAIN_CHAIN_ID } from '@/config/wagmi'; // Contract address and network ID
import { ALLOWED_CONTRACTS } from '@/config/allowedContracts';

// Minimal ABI: expose only methods used by the dApp (no admin functions)
const contractAbi = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'burnNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'activateNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function useCrazyCubeUltimate() {
  const { address: accountAddress, chainId } = useAccount();
  const isConnectedToCorrectChain = chainId === MAIN_CHAIN_ID;

  // --- Functions to read data from contract ---

  // Get total NFT count (totalSupply)
  const {
    data: totalSupply,
    isLoading: isLoadingTotalSupply,
    error: errorTotalSupply,
    refetch: refetchTotalSupply,
  } = useReadContract({
    abi: contractAbi,
    address: NFT_CONTRACT_ADDRESS,
    functionName: 'totalSupply',
    chainId: MAIN_CHAIN_ID,
    query: {
      enabled: isConnectedToCorrectChain, // Query is active if connected to correct network
    },
  });

  // Get NFT balance for current account (balanceOf)
  const {
    data: balanceOf,
    isLoading: isLoadingBalanceOf,
    error: errorBalanceOf,
    refetch: refetchBalanceOf,
  } = useReadContract({
    abi: contractAbi,
    address: NFT_CONTRACT_ADDRESS,
    functionName: 'balanceOf',
    args: accountAddress ? [accountAddress] : undefined, // Argument - account address
    chainId: MAIN_CHAIN_ID,
    query: {
      enabled: isConnectedToCorrectChain && !!accountAddress, // Active if address exists and correct network
    },
  });

  // --- Functions to write data (send transactions) ---
  const {
    data: hash,
    error: writeContractError,
    isPending: isSubmittingTx,
    writeContractAsync,
  } = useWriteContract();

  // Function to burn NFT (burnNFT)
  const burnNFT = async (tokenId: bigint) => {
    if (!isConnectedToCorrectChain) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Wrong Network',
              description: 'Please switch to Monad Testnet',
              variant: 'destructive',
            },
          })
        );
      return;
    }
    if (!writeContractAsync) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Transaction unavailable',
              description: 'Write function is not available',
              variant: 'destructive',
            },
          })
        );
      return;
    }
    if (!ALLOWED_CONTRACTS.has(
      (NFT_CONTRACT_ADDRESS as `0x${string}`).toLowerCase() as `0x${string}`
    )) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Contract blocked',
              description: 'Target contract is not in the allowlist',
              variant: 'destructive',
            },
          })
        );
      return;
    }
    try {
      const txHash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'burnNFT',
        args: [tokenId],
        chainId: MAIN_CHAIN_ID,
      });
      return txHash;
    } catch (err) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Burn failed',
              description: (err as Error)?.message || 'Unknown error',
              variant: 'destructive',
            },
          })
        );
      throw err;
    }
  };

  // Function to activate NFT (activateNFT)
  const activateNFT = async (tokenId: bigint) => {
    if (!isConnectedToCorrectChain) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Wrong Network',
              description: 'Please switch to Monad Testnet',
              variant: 'destructive',
            },
          })
        );
      return;
    }
    if (!writeContractAsync) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Transaction unavailable',
              description: 'Write function is not available',
              variant: 'destructive',
            },
          })
        );
      return;
    }
    if (!ALLOWED_CONTRACTS.has(
      (NFT_CONTRACT_ADDRESS as `0x${string}`).toLowerCase() as `0x${string}`
    )) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Contract blocked',
              description: 'Target contract is not in the allowlist',
              variant: 'destructive',
            },
          })
        );
      return;
    }
    try {
      const txHash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: 'activateNFT',
        args: [tokenId],
        chainId: MAIN_CHAIN_ID,
      });
      return txHash;
    } catch (err) {
      if (typeof window !== 'undefined')
        window.dispatchEvent(
          new CustomEvent('crazycube:toast', {
            detail: {
              title: 'Activation failed',
              description: (err as Error)?.message || 'Unknown error',
              variant: 'destructive',
            },
          })
        );
      throw err;
    }
  };

  // --- Read data and statuses ---
  const {
    isLoading: isConfirmingTx,
    isSuccess: isTxConfirmed,
    error: txConfirmationError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    // Read data
    totalSupply,
    isLoadingTotalSupply,
    errorTotalSupply,
    refetchTotalSupply,

    balanceOf,
    isLoadingBalanceOf,
    errorBalanceOf,
    refetchBalanceOf,

    // Write functions
    burnNFT,
    activateNFT,

    // Write statuses
    isSubmittingTx, // true, when transaction is being sent to wallet
    writeContractError, // Error when sending transaction
    hash, // Transaction hash after sending

    // Transaction confirmation statuses
    isConfirmingTx, // true, when waiting for transaction mining
    isTxConfirmed, // true, when transaction is confirmed
    txConfirmationError, // Error during transaction confirmation
  };
}
