'use client';

import { useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useSafeContractWrite } from '@/hooks/use-safe-contract-write';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Heart,
  Flame,
  Trophy,
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { formatEther, parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { apeChain } from '@/config/chains';
import { useTranslation } from 'react-i18next';

const GAME_CONTRACT_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'getGraveyardSize',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getBreedCostCRAA',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'nftData',
    outputs: [
      { internalType: 'uint8', name: 'rarity', type: 'uint8' },
      { internalType: 'uint8', name: 'initialStars', type: 'uint8' },
      { internalType: 'bool', name: 'isActivated', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'nftState',
    outputs: [
      { internalType: 'uint8', name: 'currentStars', type: 'uint8' },
      { internalType: 'uint256', name: 'lockedCRAA', type: 'uint256' },
      { internalType: 'uint256', name: 'lastPingTime', type: 'uint256' },
      { internalType: 'uint256', name: 'lastBreedTime', type: 'uint256' },
      { internalType: 'bool', name: 'isInGraveyard', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ping',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint8', name: 'waitHours', type: 'uint8' },
    ],
    name: 'burnNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'parent1', type: 'uint256' },
      { internalType: 'uint256', name: 'parent2', type: 'uint256' },
    ],
    name: 'breedNFTs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export function ContractInteraction() {
  const { address, isConnected } = useAccount();
  const { t } = useTranslation();
  const { toast } = useToast();

  // Form states
  const [pingTokenId, setPingTokenId] = useState('');
  const [burnTokenId, setBurnTokenId] = useState('');
  const [burnWaitHours, setBurnWaitHours] = useState('24');
  const [parent1Id, setParent1Id] = useState('');
  const [parent2Id, setParent2Id] = useState('');
  const [queryTokenId, setQueryTokenId] = useState('');

  // Contract reads - using secure addresses from chain config
  const { data: graveyardSize } = useReadContract({
    address: apeChain.contracts.gameProxy.address,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getGraveyardSize',
  });

  const { data: breedCost } = useReadContract({
    address: apeChain.contracts.gameProxy.address,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getBreedCostCRAA',
  });

  const { data: nftData, refetch: refetchNftData } = useReadContract({
    address: apeChain.contracts.gameProxy.address,
    abi: GAME_CONTRACT_ABI,
    functionName: 'nftData',
    args: queryTokenId ? [BigInt(queryTokenId)] : undefined,
    query: { enabled: !!queryTokenId },
  });

  const { data: nftState, refetch: refetchNftState } = useReadContract({
    address: apeChain.contracts.gameProxy.address,
    abi: GAME_CONTRACT_ABI,
    functionName: 'nftState',
    args: queryTokenId ? [BigInt(queryTokenId)] : undefined,
    query: { enabled: !!queryTokenId },
  });

  // Contract writes
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useSafeContractWrite();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handlePing = async () => {
    if (!pingTokenId) {
      toast({
        title: t('contractInteraction.error', 'Error'),
        description: t(
          'contractInteraction.enterTokenId',
          'Please enter a token ID'
        ),
        variant: 'destructive',
      });
      return;
    }

    try {
      writeContract({
        address: apeChain.contracts.gameProxy.address,
        abi: GAME_CONTRACT_ABI,
        functionName: 'ping',
        args: [BigInt(pingTokenId)],
      });

      toast({
        title: 'Transaction Sent',
        description: `Pinging NFT #${pingTokenId}...`,
      });
    } catch (error) {}
  };

  const handleBurn = async () => {
    if (!burnTokenId || !burnWaitHours) {
      toast({
        title: t('contractInteraction.error', 'Error'),
        description: t(
          'contractInteraction.enterTokenIdAndHours',
          'Please enter token ID and wait hours'
        ),
        variant: 'destructive',
      });
      return;
    }

    try {
      writeContract({
        address: apeChain.contracts.gameProxy.address,
        abi: GAME_CONTRACT_ABI,
        functionName: 'burnNFT',
        args: [BigInt(burnTokenId), parseInt(burnWaitHours)],
      });

      toast({
        title: 'Transaction Sent',
        description: `Burning NFT #${burnTokenId} with ${burnWaitHours}h wait...`,
      });
    } catch (error) {}
  };

  const handleBreed = async () => {
    if (!parent1Id || !parent2Id) {
      toast({
        title: t('contractInteraction.error', 'Error'),
        description: t(
          'contractInteraction.enterBothParents',
          'Please enter both parent token IDs'
        ),
        variant: 'destructive',
      });
      return;
    }

    try {
      writeContract({
        address: apeChain.contracts.gameProxy.address,
        abi: GAME_CONTRACT_ABI,
        functionName: 'breedNFTs',
        args: [BigInt(parent1Id), BigInt(parent2Id)],
      });

      toast({
        title: 'Transaction Sent',
        description: `Breeding NFT #${parent1Id} with #${parent2Id}...`,
      });
    } catch (error) {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Address copied to clipboard',
    });
  };

  if (!isConnected) {
    return (
      <Alert>
        <Zap className='h-4 w-4' />
        <AlertDescription>
          Connect your wallet to interact with contracts
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Contract Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-slate-900/50 border-purple-500/30'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-purple-300 flex items-center gap-1'>
              <Trophy className='w-4 h-4' />
              Graveyard Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-400'>
              {graveyardSize ? graveyardSize.toString() : 'Loading...'}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-slate-900/50 border-pink-500/30'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-pink-300 flex items-center gap-1'>
              <Heart className='w-4 h-4' />
              Breed Cost
            </CardTitle>
          </CardHeader>{' '}
          <CardContent>
            <div className='text-2xl font-bold text-pink-400'>
              {breedCost
                ? `${parseFloat(formatEther(breedCost as bigint)).toFixed(2)} CRAA`
                : 'Loading...'}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-slate-900/50 border-green-500/30'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-green-300'>
              Contract Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className='bg-green-500/20 text-green-400'>
              ✅ {t('wallet.connected', 'Connected')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      <AnimatePresence>
        {hash && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className='border-blue-500/50 bg-blue-500/10'>
              <ExternalLink className='h-4 w-4' />
              <AlertDescription>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium text-blue-300'>
                      Transaction Submitted
                    </div>
                    <div className='text-xs text-blue-400 font-mono mt-1'>
                      {hash.slice(0, 20)}...{hash.slice(-10)}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {isConfirming ? (
                      <Badge className='bg-yellow-500/20 text-yellow-400'>
                        <Loader2 className='w-3 h-3 mr-1 animate-spin' />
                        Confirming...
                      </Badge>
                    ) : isConfirmed ? (
                      <Badge className='bg-green-500/20 text-green-400'>
                        ✅ Confirmed
                      </Badge>
                    ) : null}
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => copyToClipboard(hash)}
                    >
                      <Copy className='w-3 h-3' />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {writeError && (
        <Alert variant='destructive'>
          <AlertDescription>{writeError.message}</AlertDescription>
        </Alert>
      )}

      {/* Contract Interactions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Query NFT */}
        <Card className='bg-slate-900/50 border-cyan-500/30'>
          <CardHeader>
            <CardTitle className='text-cyan-300'>Query NFT Data</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label className='text-cyan-200'>Token ID</Label>
              <Input
                type='number'
                placeholder='Enter NFT Token ID'
                value={queryTokenId}
                onChange={e => setQueryTokenId(e.target.value)}
                className='bg-slate-800 border-cyan-500/30'
              />
            </div>{' '}
            {queryTokenId && (
              <div className='space-y-2 text-sm'>
                <div className='text-center text-slate-400'>
                  {nftData
                    ? 'NFT Data Loaded ✓'
                    : 'Enter Token ID to query NFT data'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ping Function */}
        <Card className='bg-slate-900/50 border-blue-500/30'>
          <CardHeader>
            <CardTitle className='text-blue-300 flex items-center gap-2'>
              <Zap className='w-5 h-5' />
              Ping NFT
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label className='text-blue-200'>Token ID</Label>
              <Input
                type='number'
                placeholder='Enter NFT Token ID'
                value={pingTokenId}
                onChange={e => setPingTokenId(e.target.value)}
                className='bg-slate-800 border-blue-500/30'
              />
            </div>

            <Button
              onClick={handlePing}
              disabled={isWritePending || isConfirming || !pingTokenId}
              className='w-full bg-blue-600 hover:bg-blue-700'
            >
              {isWritePending || isConfirming ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isWritePending ? 'Sending...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Zap className='mr-2 h-4 w-4' />
                  Ping NFT
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Burn Function */}
        <Card className='bg-slate-900/50 border-red-500/30'>
          <CardHeader>
            <CardTitle className='text-red-300 flex items-center gap-2'>
              <Flame className='w-5 h-5' />
              Burn NFT
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label className='text-red-200'>Token ID</Label>
              <Input
                type='number'
                placeholder='Enter NFT Token ID'
                value={burnTokenId}
                onChange={e => setBurnTokenId(e.target.value)}
                className='bg-slate-800 border-red-500/30'
              />
            </div>

            <div>
              <Label className='text-red-200'>Wait Hours</Label>
              <Input
                type='number'
                placeholder='Hours to wait (24, 48, 72)'
                value={burnWaitHours}
                onChange={e => setBurnWaitHours(e.target.value)}
                className='bg-slate-800 border-red-500/30'
              />
            </div>

            <Button
              onClick={handleBurn}
              disabled={isWritePending || isConfirming || !burnTokenId}
              className='w-full bg-red-600 hover:bg-red-700'
            >
              {isWritePending || isConfirming ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isWritePending ? 'Sending...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Flame className='mr-2 h-4 w-4' />
                  Burn NFT
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Breed Function */}
        <Card className='bg-slate-900/50 border-pink-500/30'>
          <CardHeader>
            <CardTitle className='text-pink-300 flex items-center gap-2'>
              <Heart className='w-5 h-5' />
              Breed NFTs
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label className='text-pink-200'>Parent 1 Token ID</Label>
              <Input
                type='number'
                placeholder='Enter first parent NFT ID'
                value={parent1Id}
                onChange={e => setParent1Id(e.target.value)}
                className='bg-slate-800 border-pink-500/30'
              />
            </div>

            <div>
              <Label className='text-pink-200'>Parent 2 Token ID</Label>
              <Input
                type='number'
                placeholder='Enter second parent NFT ID'
                value={parent2Id}
                onChange={e => setParent2Id(e.target.value)}
                className='bg-slate-800 border-pink-500/30'
              />
            </div>

            <Button
              onClick={handleBreed}
              disabled={
                isWritePending || isConfirming || !parent1Id || !parent2Id
              }
              className='w-full bg-pink-600 hover:bg-pink-700'
            >
              {isWritePending || isConfirming ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isWritePending ? 'Sending...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Heart className='mr-2 h-4 w-4' />
                  Breed NFTs
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
