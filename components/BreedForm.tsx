'use client';

import { useState } from 'react';
import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { useSafeContractWrite } from '@/hooks/use-safe-contract-write';
import { nftAbi } from '@/config/abis/nftAbi';
import { NFT_CONTRACT_ADDRESS, MAIN_CHAIN_ID } from '@/config/wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useGraveyardAvailability } from '@/hooks/useGraveyardAvailability';
import { formatEther } from 'viem';
import { useNetwork } from '@/hooks/use-network';
import DOMPurify from 'isomorphic-dompurify';
import React from 'react';
import { SECURITY_CONFIG, validateChainId, validateContractAddress } from '@/config/security';
import { useToast } from '@/components/ui/use-toast';

const bytes32Random = (): `0x${string}` => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return ('0x' +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')) as `0x${string}`;
};

export function BreedForm() {
  const { address } = useAccount();
  const { nfts, isLoading: isLoadingNFTs } = useAlchemyNfts();
  const { has: graveyardHas, loading: loadingGraveyard } =
    useGraveyardAvailability();
  const [parent1, setParent1] = useState<number | null>(null);
  const [parent2, setParent2] = useState<number | null>(null);
  const { isApeChain, requireApeChain } = useNetwork();
  const { toast } = useToast();
  const chainId = useChainId();

  const { data: breedCost } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: 'getBreedCostCRAA',
    chainId: MAIN_CHAIN_ID,
  });

  // Removed unused breedCooldown to fix linter error

  const {
    writeContract,
    isPending: isBreeding,
    error: breedError,
  } = useSafeContractWrite();

  const isReady = parent1 !== null && parent2 !== null && parent1 !== parent2;

  const handleBreed = requireApeChain(async () => {
    if (!isReady) return;

    // CRITICAL: Validate chainId to prevent network spoofing
    if (!validateChainId(chainId)) {
      toast({
        title: 'Wrong Network',
        description: 'Please switch to ApeChain network',
        variant: 'destructive',
      });
      return;
    }

    // CRITICAL: Validate contract addresses
    const expectedNFTContract = SECURITY_CONFIG.CONTRACTS.NFT_CONTRACT;
    if (!validateContractAddress(expectedNFTContract)) {
      toast({
        title: 'Security Error',
        description: 'Invalid NFT contract address',
        variant: 'destructive',
      });
      return;
    }


    try {
      await writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: nftAbi,
        functionName: 'requestBreed',
        args: [BigInt(parent1!), BigInt(parent2!), bytes32Random()],
        chainId: MAIN_CHAIN_ID,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? DOMPurify.sanitize(error.message) : 'Breeding failed';
      console.error('Breeding error:', errorMessage);
    }

  });

  if (!address) return <p>Please connect your wallet.</p>;

  return (
    <Card className='mx-auto max-w-2xl mt-6'>
      <CardHeader>
        <CardTitle>Bridge (Revive) a Cube</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingGraveyard ? (
          <div className='flex justify-center py-8'>
            <Loader2 className='animate-spin' />
          </div>
        ) : !graveyardHas ? (
          <p className='text-center text-red-400 mb-4'>
            Graveyard is empty. Bridging temporarily unavailable.
          </p>
        ) : isLoadingNFTs ? (
          <div className='flex justify-center py-8'>
            <Loader2 className='animate-spin' />
          </div>
        ) : (
          <div>
            <p className='mb-4 text-sm text-slate-300'>
              Select two cubes to send for breeding. One random cube will jump
              out from the graveyard!
            </p>
            <div className='grid grid-cols-2 gap-3 mb-6 max-h-80 overflow-y-auto pr-2'>
              {nfts.map(nft => {
                const selected =
                  nft.tokenId === parent1 || nft.tokenId === parent2;
                return (
                  <button
                    type='button'
                    key={nft.id}
                    onClick={() => {
                      if (parent1 === null) setParent1(nft.tokenId);
                      else if (parent2 === null && nft.tokenId !== parent1)
                        setParent2(nft.tokenId);
                      else if (nft.tokenId === parent1) setParent1(null);
                      else if (nft.tokenId === parent2) setParent2(null);
                    }}
                    className={`border rounded-md p-2 text-xs hover:border-cyan-400 transition-colors ${selected ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-700'}`}
                  >
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className='w-full aspect-square object-cover rounded'
                    />
                    <span className='block mt-1 text-center'>
                      #{nft.tokenId}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className='space-y-2'>
              <p>Parent 1: {parent1 ?? '-'}</p>
              <p>Parent 2: {parent2 ?? '-'}</p>
              {typeof breedCost === 'bigint' && (
                <p>
                  Breed cost: {parseFloat(formatEther(breedCost)).toFixed(2)}{' '}
                  CRAA
                </p>
              )}
              {breedError && (
                <p className='text-red-500 text-sm'>{DOMPurify.sanitize(breedError.message)}</p>
              )}
              <Button
                disabled={!isApeChain || !isReady || isBreeding}
                onClick={handleBreed}
                className='w-full'
              >
                {isBreeding ? 'Waiting for confirmation...' : 'Bridge NFT'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
