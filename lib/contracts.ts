import { activeChain } from '@/config/chains';
import { CRAZY_OCTAGON_CORE_ABI } from '@/lib/abi/crazyOctagon';

export const coreContractConfig = {
  address: activeChain.contracts.gameProxy.address,
  abi: CRAZY_OCTAGON_CORE_ABI,
} as const;

export const nftContractConfig = {
  address: activeChain.contracts.crazyCubeNFT.address,
  // Minimal NFT ABI for ownership queries
  abi: [
    {
      constant: true,
      inputs: [
        { name: 'owner', type: 'address' },
      ],
      name: 'balanceOf',
      outputs: [
        { name: '', type: 'uint256' },
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'index', type: 'uint256' },
      ],
      name: 'tokenOfOwnerByIndex',
      outputs: [
        { name: '', type: 'uint256' },
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
  ],
} as const;