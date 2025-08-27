import { useNFTContractInfo } from '@/hooks/useNFTContractInfo';
import { useNFTGameInfo } from '@/hooks/useNFTGameData';
import {
  AlchemyNFT,
  getNFTImage,
  getTokenIdAsDecimal,
} from '@/hooks/useUserNFTs';
import { UnifiedNftCard } from '@/components/UnifiedNftCard';
import { Star, Plus } from 'lucide-react';
import { getRarityColor, getRarityLabel } from '@/lib/rarity';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type AnyNFT = AlchemyNFT | { tokenId: number; image?: string; name?: string };

interface BreedCardProps {
  nft: AnyNFT;
  index: number;
  selected?: boolean;
  selectedOrder?: 1 | 2;
  disableSelect?: boolean;
  onSelect?: (tokenId: number) => void;
  onActionComplete?: () => void;
  isOnCooldown?: boolean;
  cooldownRemaining?: number | undefined;
}

// convert ipfs:// hash to https url via nftstorage gateway
const resolveImageSrc = (url?: string) => {
  if (!url) return '/favicon.ico';
  if (url.startsWith('ipfs://')) {
    return `https://nftstorage.link/ipfs/${url.slice(7)}`;
  }
  return url;
};

export const BreedCard = React.memo(function BreedCard({
  nft,
  index,
  selected,
  selectedOrder,
  disableSelect,
  onSelect,
  isOnCooldown,
  cooldownRemaining,
}: BreedCardProps) {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  // Derive tokenId (number) robustly
  let tokenIdNum: number | null = null;
  if ('tokenId' in nft && typeof nft.tokenId === 'number') {
    tokenIdNum = nft.tokenId;
  } else {
    const dec = getTokenIdAsDecimal(nft as AlchemyNFT);
    if (/^\d+$/.test(dec)) tokenIdNum = Number(dec);
  }

  const tokenIdStr = tokenIdNum !== null ? String(tokenIdNum) : undefined;
  const { nftInfo } = useNFTContractInfo(tokenIdStr);

  // Get game data for cooldown information
  const { nftInfo: gameInfo } = useNFTGameInfo(tokenIdStr);

  const tokenIdDisplay = tokenIdStr ?? '?';

  const rarityLabel = useMemo(() => {
    if (!nftInfo) return undefined;
    return getRarityLabel(nftInfo.static.initialStars);
  }, [nftInfo]);
  const rarityColorClass = useMemo(() => {
    if (!nftInfo) return undefined;
    return `${getRarityColor(nftInfo.static.initialStars)} text-white`;
  }, [nftInfo]);

  // Stars row widget
  const starsWidget = nftInfo ? (
    <span className='flex space-x-1'>
      {Array.from({ length: nftInfo.static.initialStars }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < nftInfo.dynamic.currentStars ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
        />
      ))}
    </span>
  ) : null;

  const widgets = [] as JSX.Element[];
  if (starsWidget) widgets.push(starsWidget);

  // grey-out if no stars left or has active cooldowns
  const noStars = nftInfo && nftInfo.dynamic.currentStars === 0;
  const hasActiveCooldown = gameInfo ? gameInfo.breedCooldown > 0 : false;

  const formatDuration = (sec: number): string => {
    if (sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${!h && !m ? s + 's' : ''}`.trim();
  };

  const ringClass =
    selectedOrder === 1
      ? 'ring-4 ring-pink-500/70 animate-pulse'
      : selectedOrder === 2
        ? 'ring-4 ring-purple-500/70 animate-pulse'
        : '';

  const finalDisabled =
    disableSelect || noStars || hasActiveCooldown || isOnCooldown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative overflow-hidden transition-all duration-300 group cursor-pointer',
        'hover:shadow-2xl hover:scale-105 hover:-translate-y-1',
        'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-700/30',
        selected && 'ring-2 ring-purple-500 shadow-purple-500/50',
        disableSelect && 'opacity-50 cursor-not-allowed',
        isMobile && 'hover:scale-100 hover:translate-y-0'
      )}
    >
      {/* gradient frame matching breed page theme */}
      <div
        className={`p-0.5 rounded-lg bg-gradient-to-br from-pink-600/60 to-purple-600/60 ${finalDisabled ? 'grayscale opacity-40' : ''} ${ringClass}`}
      >
        <div className='relative rounded-lg overflow-hidden'>
          <UnifiedNftCard
            imageSrc={resolveImageSrc(
              'image' in nft && nft.image
                ? nft.image
                : getNFTImage(nft as AlchemyNFT)
            )}
            tokenId={tokenIdDisplay}
            title={
              'name' in nft && nft.name
                ? nft.name
                : 'title' in nft &&
                    typeof (nft as { title?: string }).title === 'string'
                  ? (nft as { title: string }).title
                  : `Cube #${tokenIdDisplay}`
            }
            rarityLabel={rarityLabel ?? ''}
            rarityColorClass={rarityColorClass ?? ''}
            widgets={widgets}
            highlight={!!selected}
            delay={0}
            onClick={() => {
              if (!finalDisabled && tokenIdNum !== null) onSelect?.(tokenIdNum);
            }}
          />
          {/* Selection overlay ring; and impact text */}
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 rounded-lg pointer-events-none'
            />
          )}
          {/* star penalty overlay */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{
                opacity: [1, 0.8, 1],
                scale: [1, 1.1, 1],
                y: -20,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                opacity: { repeat: 3, duration: 0.4 },
                scale: { repeat: 3, duration: 0.4 },
              }}
              className='absolute inset-0 flex items-center justify-center pointer-events-none z-20'
            >
              <div className='relative'>
                {/* Glowing background */}
                <div className='absolute inset-0 bg-red-500/60 rounded-xl blur-lg animate-pulse'></div>
                {/* Main text with multiple borders */}
                <div className='relative bg-gradient-to-r from-red-600 to-orange-600 text-white text-3xl font-black px-3 py-1.5 rounded-xl border-3 border-yellow-400 shadow-2xl'>
                  <div className='absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg animate-pulse'></div>
                  <span
                    className='relative drop-shadow-2xl'
                    style={{
                      textShadow:
                        '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
                    }}
                  >
                    -1 ⭐
                  </span>
                </div>
                {/* Warning text below */}
                <div className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap'>
                  <div className='bg-black/80 text-red-300 text-sm font-bold px-3 py-1 rounded-full border border-red-500/50'>
                    ⚠️ {t('sections.breed.guide.penalty', 'Star will be lost!')}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {/* Plus overlay when selectable */}
          {!selected && !finalDisabled && (
            <button
              onClick={() => {
                if (tokenIdNum !== null) onSelect?.(tokenIdNum);
              }}
              className='absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-lg'
            >
              <Plus className='w-8 h-8 text-pink-300' />
            </button>
          )}
          {/* Cooldown overlay */}
          {hasActiveCooldown && gameInfo && (
            <div className='absolute bottom-3 left-2 right-2 flex items-center justify-center gap-2 text-lg font-bold text-orange-300 bg-gradient-to-r from-orange-700/80 to-pink-700/80 rounded-xl py-1 px-2 shadow-lg pointer-events-none border-2 border-orange-400/40'>
              <span className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-5 h-5 mr-1 text-orange-200'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z'
                  />
                </svg>
              </span>
              <span>{t('sections.breed.cooldown', 'Cooldown:')}</span>
              <span className='text-white drop-shadow-lg'>
                {formatDuration(gameInfo.breedCooldown)}
              </span>
            </div>
          )}

          {/* Breeding cooldown overlay */}
          {isOnCooldown && cooldownRemaining && (
            <div className='absolute top-3 left-2 right-2 flex items-center justify-center gap-2 text-lg font-bold text-blue-300 bg-gradient-to-r from-blue-700/80 to-cyan-700/80 rounded-xl py-1 px-2 shadow-lg pointer-events-none border-2 border-blue-400/40'>
              <span className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-5 h-5 mr-1 text-blue-200'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z'
                  />
                </svg>
              </span>
              <span>{t('sections.breed.breedingCooldown', 'Breeding:')}</span>
              <span className='text-white drop-shadow-lg'>
                {cooldownRemaining}s
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
