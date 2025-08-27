'use client';

import { useEffect, useState } from 'react';
import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { useAlchemyNfts } from '@/hooks/useAlchemyNfts';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Loader2, Star, Lock, Skull } from 'lucide-react';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface UserNFTInfo {
  tokenId: string;
  rarity: number;
  stars: number;
  lockedCRAA: string; // formatted ether string
  lockedCRAAWei: bigint; // raw wei for math
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

// Minimal ERC721 Enumerable ABI
const ERC721_ENUM_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function UserNftsList() {
  const { address, isConnected } = useAccount();
  const { nfts: alchemyNfts, isLoading: alchemyLoading } = useAlchemyNfts();
  const { getNFTGameData } = useCrazyCubeGame();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<UserNFTInfo[]>([]);
  const [totalLockedCRAA, setTotalLockedCRAA] = useState<string>('0');
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
          setTotalLockedCRAA('0');
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

          if (data) {
            tokens.push({
              tokenId,
              rarity: data.rarity,
              stars: data.currentStars,
              lockedCRAA: data.lockedCRAA,
              lockedCRAAWei: data.lockedCRAAWei,
              isInGraveyard: data.isInGraveyard,
              image:
                typeof nft.image === 'string'
                  ? nft.image
                  : (nft.image as any)?.cachedUrl ||
                    (nft.image as any)?.pngUrl ||
                    (nft.image as any)?.originalUrl ||
                    ((nft as any).media?.[0]?.gateway ?? ''),
            });
            totalLocked += data.lockedCRAAWei;
          } else {
            tokens.push({
              tokenId: tokenId.toString(),
              rarity: Number(nft.rarity) || 0,
              stars: Number(nft.stars) || 0,
              lockedCRAA: '0',
              lockedCRAAWei: 0n,
              isInGraveyard: nft.isInGraveyard || nft.frozen,
              image:
                typeof nft.image === 'string'
                  ? nft.image
                  : (nft.image as any)?.cachedUrl ||
                    (nft.image as any)?.pngUrl ||
                    (nft.image as any)?.originalUrl ||
                    ((nft as any).media?.[0]?.gateway ?? ''),
            });
          }
        });

        setNfts(tokens);
        setTotalLockedCRAA(formatEther(totalLocked));
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
                            <img
                              src={nft.image}
                              alt='thumb'
                              className='w-8 h-8 rounded-sm object-cover'
                            />
                          )}
                          NFT #{nft.tokenId}
                        </span>
                        <span className='text-xs text-violet-300 font-semibold'>
                          {rarityNames[nft.rarity] || 'Common'}
                        </span>
                      </div>
                      <div className='flex items-center text-yellow-400 text-sm mb-1'>
                        {Array.from({ length: nft.stars }).map((_, i) => (
                          <Star key={i} className='h-4 w-4 fill-yellow-400' />
                        ))}
                        {nft.stars === 0 && (
                          <span className='text-gray-500 text-xs'>
                            {t('info.noStars', 'No stars')}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center text-green-400 text-sm'>
                        <Lock className='h-4 w-4 mr-1' />
                        {t('info.lockedCra', 'Locked CRAA')}:{' '}
                        {Number(nft.lockedCRAA).toFixed(4)}
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
                            <img
                              src={nft.image}
                              alt='thumb'
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
                        {t('info.lockedCra', 'Locked CRAA')}:{' '}
                        {Number(nft.lockedCRAA).toFixed(4)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {nfts.length > 0 && Number(totalLockedCRAA) > 0 && (
        <Card className='p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 text-center shadow-lg shadow-yellow-500/20'>
          <div className='mb-4'>
            <h3 className='text-2xl font-bold text-yellow-300 mb-2'>
              💰 {t('info.totalCraLocked', 'Total CRAA locked in your NFTs')}
            </h3>
            <div className='text-4xl font-black text-white bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent'>
              {Number(totalLockedCRAA).toFixed(4)} CRAA
            </div>
          </div>
          <div className='bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mt-4'>
            <p className='text-yellow-200 text-base font-semibold leading-relaxed'>
              ⚠️{' '}
              {t(
                'info.craLockedWarning',
                'CRAA locked inside an NFT are not burned and travel with the NFT when it is transferred, sold or moved in any way. They permanently belong to the NFT itself. You can obtain these tokens only by'
              )}{' '}
              <span className='text-red-400 font-bold'>CRAA</span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
