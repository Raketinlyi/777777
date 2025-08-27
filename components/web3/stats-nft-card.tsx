'use client';

import { ReactNode } from 'react';
import { UnifiedNftCard } from '@/components/UnifiedNftCard';
import type { NFT } from '@/types/nft';
import { getColor, getLabel } from '@/lib/rarity';
import { Star } from 'lucide-react';

/* Helper to resolve ipfs:// links */
const resolveImage = (url?: string | null) => {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('ipfs://'))
    return `https://nftstorage.link/ipfs/${url.slice(7)}`;
  return url;
};

interface Props {
  nft: NFT;
  delay?: number;
  onSelect?: (n: NFT) => void;
}

export default function StatsNFTCard({ nft, delay = 0, onSelect }: Props) {
  const rarityColor = getColor(nft.stars || 1);
  const widgets: ReactNode[] = [];
  if (nft.stars) {
    widgets.push(
      <span key='stars' className='flex space-x-0.5'>
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`w-3 h-3 ${idx < (nft.stars || 0) ? 'text-yellow-400 fill-current' : 'text-slate-600'}`}
          />
        ))}
      </span>
    );
  }
  return (
    <UnifiedNftCard
      imageSrc={resolveImage(nft.image)}
      tokenId={nft.tokenId}
      title={nft.name}
      rarityLabel={getLabel(nft.stars || 1) || 'Common'}
      rarityColorClass={`${rarityColor} text-xs`}
      widgets={widgets}
      delay={delay}
      onClick={() => onSelect?.(nft)}
    />
  );
}
