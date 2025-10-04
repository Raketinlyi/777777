'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Loader2, Star, Lock, Skull } from 'lucide-react';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  computeStarState,
  getBaseStarsForRarity,
  getStarsFromIndex,
  normalizeStars,
  rarityIndexByLabel,
  starCountToIndex,
} from '@/lib/stars';
import type { StarState } from '@/lib/stars';
import { StarMeter } from '@/components/star-meter';

interface UserNFTInfo {
  tokenId: string;
  rarityIndex: number;
  baseStars: number;
  currentStars: number;
  bonusStars: number;
  starState: StarState;
  lockedOcta: string; // formatted ether string
  lockedOctaWei: bigint; // raw wei for math
  isInGraveyard?: boolean;
  image?: string;
}

const getRarityNames = (t: (key: string, fallback: string) => string) => [
  t('rarity.common', 'Common'),
  t('rarity.uncommon', 'Uncommon'),
  t('rarity.rare', 'Rare'),
  t('rarity.epic', 'Epic'),
  t('rarity.legendary', 'Legendary'),
  t('rarity.mythic', 'Mythic'),
];

const formatOctaAmount = (value: string | number | null | undefined) => {
  const numeric = Number.parseFloat(String(value ?? '0'));
  if (!Number.isFinite(numeric)) {
    return '0.0000';
  }
  return numeric.toFixed(4);
};

const safeNormalizeStars = (value: unknown): number | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return normalizeStars(value);
};

export default function UserNftsList() {
  const { isConnected } = useAccount();
  const { data: alchemyNfts = [], isLoading: alchemyLoading } = useAlchemyNftsQuery();
  const { getNFTGameData } = useCrazyOctagonGame();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<UserNFTInfo[]>([]);
  const [totalLockedOcta, setTotalLockedOcta] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);

  const safeGetGameData = useCallback(
    async (tokenId: string) => {
      try {
        return await getNFTGameData(tokenId);
      } catch {
        return null;
      }
    },
    [getNFTGameData]
  );

  useEffect(() => {
    if (!isConnected || alchemyLoading) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!alchemyNfts || alchemyNfts.length === 0) {
          setNfts([]);
          setTotalLockedOcta('0');
          return;
        }

        const gameDataList = await Promise.all(
          alchemyNfts.map(nftItem => safeGetGameData(nftItem.tokenId.toString()))
        );

        const tokens: UserNFTInfo[] = [];
        let totalLocked = 0n;

        alchemyNfts.forEach((nft, idx) => {
          const data = gameDataList[idx];
          const tokenId = nft.tokenId.toString();

          const imageSrc = nft.image || '/icons/favicon-180x180.png';
          const rarityKey =
            typeof nft.rarity === 'string' ? nft.rarity.toLowerCase() : '';
          const fallbackRarityIndex = rarityIndexByLabel[rarityKey] ?? 0;
          const fallbackStars = getStarsFromIndex(fallbackRarityIndex);

          if (data) {
            const chainInitialStars = safeNormalizeStars(data.initialStars);
            const chainCurrentStars = safeNormalizeStars(data.currentStars);
            const chainBonusStars = safeNormalizeStars(data.bonusStars);
            const chainRarityStars = safeNormalizeStars(data.rarity);

            let baseStars = fallbackStars;
            if (chainRarityStars !== null) {
              baseStars = getBaseStarsForRarity(chainRarityStars);
            }
            if (chainInitialStars !== null && chainInitialStars > 0) {
              baseStars = chainInitialStars;
            }

            const currentStars =
              chainCurrentStars !== null
                ? chainCurrentStars
                : normalizeStars(nft.stars ?? baseStars);
            const inferredBonus = Math.max(0, currentStars - baseStars);
            const bonusStars =
              chainBonusStars !== null ? Math.max(0, chainBonusStars) : inferredBonus;
            const rarityIndex = starCountToIndex(baseStars > 0 ? baseStars : fallbackStars);
            const starState = computeStarState({
              baseStars,
              bonusStars,
              currentStars,
            });

            tokens.push({
              tokenId,
              rarityIndex,
              baseStars,
              currentStars,
              bonusStars,
              starState,
              lockedOcta: data.lockedOcta,
              lockedOctaWei: data.lockedOctaWei,
              isInGraveyard: data.isInGraveyard,
              image: imageSrc,
            });
            totalLocked += data.lockedOctaWei;
          } else {
            const baseStars = fallbackStars;
            const currentStars = baseStars;
            const bonusStars = 0;
            const starState = computeStarState({
              baseStars,
              bonusStars,
              currentStars,
            });

            tokens.push({
              tokenId,
              rarityIndex: fallbackRarityIndex,
              baseStars,
              currentStars,
              bonusStars,
              starState,
              lockedOcta: '0',
              lockedOctaWei: 0n,
              isInGraveyard: nft.isInGraveyard || nft.frozen,
              image: imageSrc,
            });
          }
        });

        setNfts(tokens);
        setTotalLockedOcta(formatEther(totalLocked));
      } catch {
        setError(
          'Failed to load NFTs. Please reload the page or try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isConnected, alchemyLoading, alchemyNfts, safeGetGameData]);

  if (!isConnected) {
    return (
      <Card className='p-4 bg-slate-800/50 border-slate-700'>
        <p className='text-slate-300 text-center text-sm'>
          {t('info.connectWalletNfts', 'Connect your wallet to see your NFTs.')}
        </p>
      </Card>
    );
  }

  const liveNfts = nfts.filter(nft => !nft.isInGraveyard);
  const graveyardNfts = nfts.filter(nft => nft.isInGraveyard);
  const totalLockedNumber = Number.parseFloat(totalLockedOcta || '0');
  const rarityNames = getRarityNames(t);

  let cardContent: JSX.Element;
  if (loading || alchemyLoading) {
    cardContent = (
      <div className='flex items-center justify-center py-6'>
        <Loader2 className='h-6 w-6 animate-spin text-violet-300' />
      </div>
    );
  } else if (error) {
    cardContent = <p className='text-red-400 text-sm text-center'>{error}</p>;
  } else if (nfts.length === 0) {
    cardContent = (
      <p className='text-slate-300 text-sm text-center'>
        {t('info.noNfts', "You don't own any CrazyCube NFTs.")}
      </p>
    );
  } else {
    cardContent = (
      <>
        <h3 className='text-lg font-bold text-white mb-3 text-center'>
          {t('info.yourNfts', 'Your NFTs')} ({nfts.length})
          {liveNfts.length > 0 && graveyardNfts.length > 0 && (
            <span className='text-sm text-slate-400 ml-2'>
              ({liveNfts.length} {t('info.live', 'live')}, {graveyardNfts.length}{' '}
              {t('info.inGraveyard', 'in graveyard')})
            </span>
          )}
        </h3>

        {liveNfts.length > 0 && (
          <div className='mb-4'>
            <h4 className='text-sm font-semibold text-green-400 mb-2 flex items-center'>
              <Star className='h-4 w-4 mr-1' />
              {t('info.activeNfts', 'Active NFTs')} ({liveNfts.length})
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {liveNfts.map((nft, idx) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className='p-3 rounded-lg bg-slate-900/50 border border-slate-600 space-y-1'
                >
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-slate-400 text-xs flex items-center gap-1'>
                      {nft.image && (
                        <Image
                          src={nft.image}
                          alt={`NFT #${nft.tokenId}`}
                          width={32}
                          height={32}
                          className='w-8 h-8 rounded-sm object-cover'
                        />
                      )}
                      NFT #{nft.tokenId}
                    </span>
                    <span className='text-xs text-violet-300 font-semibold'>
                      {rarityNames[nft.rarityIndex] || 'Common'}
                    </span>
                  </div>
                  <div className='mb-1'>
                    {nft.starState.totalCapacity > 0 ? (
                      <StarMeter state={nft.starState} size='sm' />
                    ) : (
                      <span className='text-gray-500 text-xs'>
                        {t('info.noStars', 'No stars')}
                      </span>
                    )}
                  </div>
                  <div className='text-xs text-slate-300 flex flex-wrap items-center gap-2'>
                    <span>
                      {t('info.starsActiveLabel', 'Active')}:{' '}
                      {nft.starState.totalActive}/{nft.starState.totalCapacity}
                    </span>
                    {nft.starState.burnedBase > 0 && (
                      <span className='text-red-300'>
                        −{nft.starState.burnedBase}{' '}
                        {t('info.starsBurned', 'burned')}
                      </span>
                    )}
                    {nft.starState.bonusSlots > 0 && (
                      <span className='text-sky-300'>
                        {t('info.bonus', 'Bonus')}:{' '}
                        {nft.starState.activeBonus}/{nft.starState.bonusSlots}
                      </span>
                    )}
                  </div>
                  <div className='text-[11px] text-slate-500'>
                    {t('info.nominalBase', 'Nominal base')}: {nft.baseStars}
                  </div>
                  <div className='flex items-center text-green-400 text-sm'>
                    <Lock className='h-4 w-4 mr-1' />
                    {t('info.lockedCra', 'Locked OCTAA')}: {formatOctaAmount(nft.lockedOcta)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {graveyardNfts.length > 0 && (
          <div>
            <h4 className='text-sm font-semibold text-red-400 mb-2 flex items-center'>
              <Skull className='h-4 w-4 mr-1' />
              {t('info.nftsInGraveyard', 'NFTs in Graveyard')} ({graveyardNfts.length})
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {graveyardNfts.map((nft, idx) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (liveNfts.length + idx) * 0.05 }}
                  className='p-3 rounded-lg bg-red-900/20 border border-red-600/30 space-y-1 opacity-75'
                >
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-red-400 text-xs flex items-center gap-1'>
                      {nft.image && (
                        <Image
                          src={nft.image}
                          alt={`NFT #${nft.tokenId}`}
                          width={32}
                          height={32}
                          className='w-8 h-8 rounded-sm object-cover'
                        />
                      )}
                      NFT #{nft.tokenId}
                    </span>
                    <span className='text-xs text-red-300 font-semibold flex items-center'>
                      <Skull className='h-3 w-3 mr-1' />
                      {rarityNames[nft.rarityIndex] || 'Common'}
                    </span>
                  </div>
                  <div className='flex items-center text-gray-500 text-sm mb-1'>
                    <span className='text-xs'>
                      💀 {t('info.inGraveyard', 'In Graveyard')}
                    </span>
                  </div>
                  {nft.starState.totalCapacity > 0 && (
                    <div className='mb-1'>
                      <StarMeter state={nft.starState} size='sm' className='opacity-70' />
                    </div>
                  )}
                  <div className='text-[11px] text-slate-400 flex flex-wrap gap-2'>
                    <span>
                      {t('info.starsActiveLabel', 'Active')}:{' '}
                      {nft.starState.totalActive}/{nft.starState.totalCapacity}
                    </span>
                    {nft.starState.burnedBase > 0 && (
                      <span className='text-red-300'>
                        −{nft.starState.burnedBase}{' '}
                        {t('info.starsBurned', 'burned')}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center text-red-400 text-sm'>
                    <Lock className='h-4 w-4 mr-1' />
                    {t('info.lockedCra', 'Locked OCTAA')}: {formatOctaAmount(nft.lockedOcta)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className='space-y-4'>
      <Card className='p-4 bg-slate-800/50 border-slate-700'>{cardContent}</Card>

      {nfts.length > 0 && totalLockedNumber > 0 && (
        <Card className='p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 text-center shadow-lg shadow-yellow-500/20'>
          <div className='mb-4'>
            <h3 className='text-2xl font-bold text-yellow-300 mb-2'>
              💰 {t('info.totalCraLocked', 'Total OCTAA locked in your NFTs')}
            </h3>
            <div className='text-4xl font-black text-black'>
              {formatOctaAmount(totalLockedOcta)} OCTAA
            </div>
          </div>
          <div className='bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mt-4'>
            <p className='text-yellow-200 text-base font-semibold leading-relaxed'>
              ⚠️{' '}
              {t(
                'info.craLockedWarning',
                'OCTAA locked inside an NFT are not burned and travel with the NFT when it is transferred, sold or moved in any way. They permanently belong to the NFT itself. You can obtain these tokens only by burning the NFT.'
              )}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
