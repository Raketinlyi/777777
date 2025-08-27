import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Skull, Clock, Zap } from 'lucide-react';
import { useNFTContractInfo } from '@/hooks/useNFTContractInfo';
import {
  type AlchemyNFT,
  getTokenIdAsDecimal,
  getNFTImage,
  getNFTName,
} from '@/hooks/useUserNFTs';
import Image from 'next/image';
import { formatEther } from 'viem';
import { useTranslation } from 'react-i18next';

interface NFTCardProps {
  nft: AlchemyNFT;
  isSelected: boolean;
  onSelect: () => void;
  onBurn: () => void;
  isBurning: boolean;
}

export function NFTCard({
  nft,
  isSelected,
  onSelect,
  onBurn,
  isBurning,
}: NFTCardProps) {
  const tokenIdDecimal = getTokenIdAsDecimal(nft);
  const {
    nftInfo,
    isLoading: isLoadingContractInfo,
    getRarityByStars,
    getColorByStars,
    getStarsBurnedCount,
    isNFTDead,
    rarity,
    currentStars,
    initialStars,
    isInGraveyard,
    lockedCRAA,
  } = useNFTContractInfo(tokenIdDecimal);

  const imageUrl = getNFTImage(nft);
  const nftName = getNFTName(nft) || `CrazyCube #${tokenIdDecimal}`;

  const { t } = useTranslation();

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all hover:scale-105 border-2 ${
        isSelected
          ? 'border-orange-500 shadow-lg shadow-orange-500/50'
          : isInGraveyard
            ? 'border-gray-600 opacity-75'
            : 'border-gray-600 hover:border-orange-400'
      }`}
      onClick={onSelect}
    >
      <CardContent className='p-0 relative'>
        {/* NFT Image */}
        <div className='relative aspect-square'>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={nftName}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
            />
          ) : (
            <div className='w-full h-full bg-gray-800 flex items-center justify-center'>
              <span className='text-gray-400'>No Image</span>
            </div>
          )}

          {/* Loading overlay for contract data */}
          {isLoadingContractInfo && (
            <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
              <div className='animate-spin text-orange-500'>
                <Zap size={24} />
              </div>
            </div>
          )}

          {/* Rarity Badge - LIVE DATA FROM CONTRACT */}
          {nftInfo && (
            <Badge
              className={`absolute top-2 right-2 ${getColorByStars(initialStars)} text-white text-xs px-1`}
            >
              {getRarityByStars(initialStars)}
            </Badge>
          )}

          {/* Graveyard indicator */}
          {isInGraveyard && (
            <div className='absolute top-2 left-2 bg-gray-900/80 p-1 rounded'>
              <Skull className='w-4 h-4 text-gray-300' />
            </div>
          )}

          {/* Stars display - LIVE DATA */}
          {nftInfo && (
            <div className='absolute bottom-2 left-2 flex items-center space-x-1 bg-black/70 px-2 py-1 rounded'>
              <Star className='w-4 h-4 text-yellow-400' fill='currentColor' />
              <span className='text-white text-sm'>
                {currentStars}/{initialStars}
              </span>
              {getStarsBurnedCount() > 0 && (
                <span className='text-red-400 text-xs'>
                  (-{getStarsBurnedCount()})
                </span>
              )}
            </div>
          )}

          {/* Dead NFT overlay */}
          {isNFTDead() && (
            <div className='absolute inset-0 bg-red-900/70 flex items-center justify-center'>
              <div className='text-center'>
                <Skull className='w-8 h-8 text-red-300 mx-auto mb-2' />
                <span className='text-red-300 text-sm font-semibold'>DEAD</span>
              </div>
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className='p-3 bg-gray-900'>
          <h3 className='font-semibold text-white text-sm truncate mb-2'>
            {nftName}
          </h3>

          {/* Contract info */}
          {nftInfo && (
            <div className='space-y-1 text-xs'>
              <div className='flex justify-between text-gray-400'>
                <span>Token ID:</span>
                <span className='text-white'>{tokenIdDecimal}</span>
              </div>

              {lockedCRAA > 0 && (
                <div className='flex justify-between text-gray-400'>
                  <span>Locked CRAA:</span>
                  <span className='text-orange-400'>
                    {parseFloat(formatEther(lockedCRAA)).toFixed(2)}
                  </span>
                </div>
              )}

              <div className='flex justify-between text-gray-400'>
                <span>Status:</span>
                <span
                  className={
                    isInGraveyard
                      ? 'text-red-400'
                      : currentStars > 0
                        ? 'text-green-400'
                        : 'text-yellow-400'
                  }
                >
                  {isInGraveyard
                    ? t('status.graveyard', 'Graveyard')
                    : currentStars > 0
                      ? t('status.alive', 'Alive')
                      : t('status.dying', 'Dying')}
                </span>
              </div>
            </div>
          )}

          {/* Burn button */}
          {isSelected && !isInGraveyard && currentStars > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                onBurn();
              }}
              disabled={isBurning}
              className='w-full mt-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2'
            >
              {isBurning ? (
                <>
                  <div className='animate-spin'>
                    <Zap size={16} />
                  </div>
                  <span>Burning...</span>
                </>
              ) : (
                <>
                  <span>🔥 Burn NFT</span>
                </>
              )}
            </button>
          )}

          {/* Info about why can't burn */}
          {isSelected && (isInGraveyard || currentStars === 0) && (
            <div className='w-full mt-3 bg-gray-700 text-gray-300 py-2 px-4 rounded text-center text-sm'>
              {isInGraveyard ? 'Already in graveyard' : 'No stars left'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
