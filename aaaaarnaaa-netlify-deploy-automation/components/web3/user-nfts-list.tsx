'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Loader2, Star, Lock, Skull } from 'lucide-react';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface UserNFTInfo {
  tokenId: string;
  rarity: number;
  baseStars: number;
  currentStars: number;
  bonusStars: number;
  displayStars: number;
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

const rarityIndexByLabel: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

const baseStarsByIndex = [1, 2, 3, 4, 5, 6];

const normalizeStars = (value: number | null | undefined) =>
  Math.max(0, Math.floor(Number(value ?? 0)));

const formatOctaAmount = (value: string | number | null | undefined) => {
  const numeric = Number.parseFloat(String(value ?? '0'));
  if (!Number.isFinite(numeric)) {
    return '0.0000';
  }
  return numeric.toFixed(4);
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

        // Parallel fetch of game data
        const gameDataList = await Promise.all(
          alchemyNfts.map(n =>
            getNFTGameData(n.tokenId.toString()).catch(() => null)
          )
        );

        const tokens: UserNFTInfo[] = [];
        let totalLocked = 0n;

        alchemyNfts.forEach((nft, idx) => {
          const data = gameDataList[idx];
          const tokenId = nft.tokenId.toString();

          const imageSrc = nft.image || '/favicon.ico';
          const fallbackRarityIndex =
            rarityIndexByLabel[nft.rarity?.toLowerCase?.() ?? ''] ?? 0;

          if (data) {
            const rarityIndex = Math.min(
              5,
              Math.max(0, Number(data.rarity ?? fallbackRarityIndex))
            );
            const baseStars = normalizeStars(data.initialStars);
            const currentStars = normalizeStars(data.currentStars);
            const bonusStars = normalizeStars(data.bonusStars);
            const displayStars = Math.max(currentStars, baseStars + bonusStars);

            tokens.push({
              tokenId,
              rarity: rarityIndex,
              baseStars,
              currentStars,
              bonusStars,
              displayStars,
              lockedOcta: data.lockedOcta,
              lockedOctaWei: data.lockedOctaWei,
              isInGraveyard: data.isInGraveyard,
              image: imageSrc,
            });
            totalLocked += data.lockedOctaWei;
          } else {
            const baseStars = baseStarsByIndex[fallbackRarityIndex] ?? 0;
            const currentStars = baseStars;
            const displayStars = baseStars;

            tokens.push({
              tokenId,
              rarity: fallbackRarityIndex,
              baseStars,
              currentStars,
              bonusStars: 0,
              displayStars,
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
  }, [isConnected, alchemyLoading, alchemyNfts, getNFTGameData]);

  if (!isConnected) {
    return (
      <Card className='p-4 bg-slate-800/50 border-slate-700'>
        <p className='text-slate-300 text-center text-sm'>
          {t('info.connectWalletNfts', 'Connect your wallet to see your NFTs.')}
        </p>
      </Card>
    );
  }

  // Separate live and graveyard NFTs for better display
  const liveNfts = nfts.filter(nft => !nft.isInGraveyard);
  const graveyardNfts = nfts.filter(nft => nft.isInGraveyard);
  const totalLockedNumber = Number.parseFloat(totalLockedOcta || '0');
  const rarityNames = getRarityNames(t);

  return (
    <div className='space-y-4'>
      <Card className='p-4 bg-slate-800/50 border-slate-700'>
        {loading || alchemyLoading ? (
          <div className='flex items-center justify-center py-6'>
            <Loader2 className='h-6 w-6 animate-spin text-violet-300' />
          </div>
        ) : error ? (
          <p className='text-red-400 text-sm text-center'>{error}</p>
        ) : nfts.length === 0 ? (
          <p className='text-slate-300 text-sm text-center'>
            {t('info.noNfts', "You don't own any CrazyCube NFTs.")}
          </p>
        ) : (
          <>
            <h3 className='text-lg font-bold text-white mb-3 text-center'>
              {t('info.yourNfts', 'Your NFTs')} ({nfts.length})
              {liveNfts.length > 0 && graveyardNfts.length > 0 && (
                <span className='text-sm text-slate-400 ml-2'>
                  ({liveNfts.length} {t('info.live', 'live')},{' '}
                  {graveyardNfts.length} {t('info.inGraveyard', 'in graveyard')}
                  )
                </span>
              )}
            </h3>

            {/* Live NFTs */}
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
                          {rarityNames[nft.rarity] || 'Common'}
                        </span>
                      </div>
                      <div className='flex items-center text-yellow-400 text-sm mb-1 gap-1'>
                        {nft.displayStars > 0 ? (
                          Array.from({ length: nft.displayStars }).map((_, i) => (
                            <Star key={i} className='h-4 w-4 fill-yellow-400' />
                          ))
                        ) : (
                          <span className='text-gray-500 text-xs'>
                            {t('info.noStars', 'No stars')}
                          </span>
                        )}
                      </div>
                      <div className='text-xs text-slate-400'>
                        {t('info.starsBreakdown', 'Base')} {nft.baseStars}
                        {nft.bonusStars > 0
                          ? ` + ${nft.bonusStars} ${t('info.bonus', 'bonus')}`
                          : ''}
                      </div>
                      <div className='flex items-center text-green-400 text-sm'>
                        <Lock className='h-4 w-4 mr-1' />
                        {t('info.lockedCra', 'Locked OCTAA')}:{' '}
                        {formatOctaAmount(nft.lockedOcta)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Graveyard NFTs */}
            {graveyardNfts.length > 0 && (
              <div>
                <h4 className='text-sm font-semibold text-red-400 mb-2 flex items-center'>
                  <Skull className='h-4 w-4 mr-1' />
                  {t('info.nftsInGraveyard', 'NFTs in Graveyard')} (
                  {graveyardNfts.length})
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
                          {rarityNames[nft.rarity] || 'Common'}
                        </span>
                      </div>
                      <div className='flex items-center text-gray-500 text-sm mb-1'>
                        <span className='text-xs'>
                          💀 {t('info.inGraveyard', 'In Graveyard')}
                        </span>
                      </div>
                      <div className='flex items-center text-red-400 text-sm'>
                        <Lock className='h-4 w-4 mr-1' />
                        {t('info.lockedCra', 'Locked OCTAA')}:{' '}
                        {formatOctaAmount(nft.lockedOcta)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

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
                'OCTAA locked inside an NFT are not burned and travel with the NFT when it is transferred, sold or moved in any way. They permanently belong to the NFT itself. You can obtain these tokens only by'
              )}{' '}
              <span className='text-red-400 font-bold'>OCTAA</span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
