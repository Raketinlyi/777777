'use client';

import { useRewardsData } from '@/hooks/useRewardsData';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { RewardCard } from './RewardCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function RewardsGrid() {
  const { rewards, isLoading, totalClaimable, claimOne, claimAll } =
    useRewardsData();
  const { nfts } = useUserNFTs();

  if (isLoading)
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='animate-spin h-8 w-8 text-yellow-400' />
      </div>
    );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between bg-black/20 border border-yellow-500/20 rounded-lg p-4'>
        <div className='text-yellow-300 text-sm font-medium'>
          Total Claimable: {totalClaimable.toFixed(2)} CRAA
        </div>
        <Button
          size='sm'
          disabled={totalClaimable === 0}
          onClick={claimAll}
          className='bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white'
        >
          Claim All
        </Button>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
        {rewards.map(r => {
          const nft = nfts.find(n => Number(n.id?.tokenId) === r.tokenId);
          if (!nft) return null;
          return (
            <RewardCard
              key={r.tokenId}
              nft={nft}
              reward={r}
              onClaim={claimOne}
              loading={isLoading}
            />
          );
        })}
      </div>
    </div>
  );
}
