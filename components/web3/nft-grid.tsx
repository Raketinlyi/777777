'use client';

import { useState } from 'react';
import { NFTCard } from './nft-card';
import { Button } from '@/components/ui/button';
import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { NFT } from '@/types/nft';

interface NFTGridProps {
  onSelect?: (nft: NFT) => void;
  selectable?: boolean;
  maxDisplay?: number;
  CardComponent?: (props: {
    nft: NFT;
    delay: number;
    onSelect?: (nft: NFT) => void;
    selectable?: boolean;
  }) => JSX.Element;
}

export function NFTGrid({
  onSelect,
  selectable = false,
  maxDisplay,
  CardComponent,
}: NFTGridProps) {
  const { nfts, isLoading, error } = useAlchemyNfts();
  const [showAll, setShowAll] = useState(false);

  // Determine how many NFTs to show
  const displayNFTs = showAll || !maxDisplay ? nfts : nfts.slice(0, maxDisplay);
  const hasMore =
    maxDisplay !== undefined && nfts.length > maxDisplay && !showAll;

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <Loader2 className='h-8 w-8 text-pink-500 animate-spin' />
        <span className='ml-2 text-pink-300'>Loading NFTs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center'>
        <p className='text-red-300'>Failed to load NFTs</p>
        <p className='text-sm text-red-400/70 mt-1'>{error.message}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className='bg-slate-900/20 border border-slate-500/50 rounded-lg p-8 text-center'>
        <p className='text-slate-300 text-lg'>No NFTs found</p>
        <p className='text-sm text-slate-400/70 mt-2'>
          Connect your wallet or mint some NFTs to get started
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {displayNFTs.map((nft, idx) => (
          <motion.div
            key={nft.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {CardComponent ? (
              <CardComponent
                nft={nft}
                delay={idx * 0.05}
                {...(onSelect ? { onSelect } : {})}
                selectable={selectable}
              />
            ) : (
              <NFTCard
                nft={nft}
                selectable={selectable}
                onClick={() => onSelect?.(nft)}
              />
            )}
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className='flex justify-center mt-6'>
          <Button
            onClick={() => setShowAll(true)}
            variant='outline'
            className='border-pink-500/30 bg-black/20 text-pink-300 hover:bg-black/40'
          >
            Show All ({nfts.length})
          </Button>
        </div>
      )}
    </div>
  );
}
