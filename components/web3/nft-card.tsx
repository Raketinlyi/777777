'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Lock } from 'lucide-react';
import Image from 'next/image';
import { useMobile } from '@/hooks/use-mobile';
import type { NFT } from '@/types/nft';
import { getColor, getLabel } from '@/lib/rarity';

interface NFTCardProps {
  nft: NFT;
  selectable?: boolean;
  onClick?: () => void;
}

export function NFTCard({ nft, selectable = false, onClick }: NFTCardProps) {
  const isMobile = useMobile();

  const rarityColors = getColor(nft.stars || 1);

  return (
    <motion.div
      whileHover={selectable ? { scale: 1.02 } : {}}
      className={`relative ${selectable ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <Card className='overflow-hidden bg-black/40 border border-pink-500/30 backdrop-blur-sm'>
        <div className='relative aspect-square overflow-hidden'>
          {/* NFT image */}
          <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900'>
            <motion.div
              animate={{
                y: [0, -5, 0],
                rotate: [0, 2, 0, -2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
              }}
              className='w-full h-full flex items-center justify-center p-3'
            >
              <Image
                src={nft.image || '/placeholder.svg'}
                alt={`${nft.name} - ${nft.rarity} NFT`}
                width={230}
                height={230}
                className='object-contain'
              />
            </motion.div>
          </div>

          {/* Frozen overlay */}
          {nft.frozen && (
            <div className='absolute inset-0 bg-blue-900/50 flex items-center justify-center backdrop-blur-sm'>
              <Lock className='h-8 w-8 text-blue-300' />
            </div>
          )}

          {/* Rarity badge */}
          <Badge className={`absolute top-2 right-2 text-xs ${rarityColors}`}>
            {getLabel(nft.stars || 1)}
          </Badge>

          {/* Reward indicator */}
          {nft.rewardBalance > 0 && (
            <div className='absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1 text-xs flex items-center'>
              <Flame className='h-3 w-3 text-orange-500 mr-1' />
              <span className='text-orange-300'>{nft.rewardBalance}</span>
            </div>
          )}
        </div>

        <CardContent className={`p-${isMobile ? '2' : '3'}`}>
          <h3
            className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} text-pink-200 truncate`}
          >
            {nft.name}
          </h3>
          <p className='text-xs text-pink-300/70'>ID: {nft.id}</p>
        </CardContent>

        <CardFooter
          className={`p-${isMobile ? '2' : '3'} pt-0 flex justify-between`}
        >
          <div className='text-xs text-pink-300/70'>
            {nft.frozen ? 'Frozen' : 'Active'}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
