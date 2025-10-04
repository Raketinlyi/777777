'use client';

import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { formatEther } from 'viem';
import type { NFT as NFTType } from '@/types/nft';
import { getRarityColor, getRarityLabel } from '@/lib/rarity';
import { useNFTContractInfo } from '@/hooks/useNFTContractInfo';
// import { Loader2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { motion } from 'framer-motion';
// import { useMobile } from '@/hooks/use-mobile';
// import Link from 'next/link';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
import { useQueryClient } from '@tanstack/react-query';
import { IpfsImage } from '@/components/IpfsImage';

// Helper to show duration in human friendly form
const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
};

export function UserNFTsPreview() {
  const { t } = useTranslation();
  const { isConnected: connected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: userNFTs = [], isLoading, error, refetch } = useAlchemyNftsQuery();
  const { pingInterval, breedCooldown } = useCrazyOctagonGame();
  const queryClient = useQueryClient();

  // Determine how many NFTs to show based on screen width (5 on mobile, 6 on md, 7 on lg+)
  const [displayCount, setDisplayCount] = useState(6);

  useEffect(() => {
    const calculateCount = () => {
      if (typeof window === 'undefined') return 6;

      const w = window.innerWidth;
      if (w < 640) {
        return 5;
      } else if (w < 1024) {
        return 8;
      }
      return 10;
    };

    // Initial calculation
    setDisplayCount(calculateCount());

    // Re-calculate on resize
    const handleResize = () => setDisplayCount(calculateCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!connected) {
    return (
      <Card className='w-full bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-cyan-300'>{t('userNFTs.title', 'Your NFTs')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center gap-4 py-6'>
            <div className='text-center text-slate-400'>
              {t(
                'userNFTs.connectToView',
                'Connect your wallet to view your OCTAAzyCube NFTs'
              )}
            </div>
            {connectors.length > 0 && (
              <Button
                onClick={() => connect({ connector: connectors[0]! })}
                className='bg-cyan-600 hover:bg-cyan-700 text-white'
              >
                {t('wallet.connect', 'Connect Wallet')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className='w-full bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-cyan-300'>
            {t('userNFTs.title', 'Your NFTs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-24 w-full rounded-lg bg-slate-800' />
                <Skeleton className='h-4 w-full bg-slate-800' />
                <Skeleton className='h-3 w-2/3 bg-slate-800' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  } // Error handling removed since we're using demo data

  if (error) {
    return (
      <Card className='w-full bg-slate-900/50 border-red-500/30 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-red-300'>
            {t('userNFTs.title', 'Your NFTs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-red-400'>
            {t('userNFTs.errorLoading', 'Error loading NFTs')}: {error.message}
            <br />
            <Button
              onClick={() => {
                // Фоновое обновление данных без перезагрузки страницы
                refetch();
                queryClient.invalidateQueries({ queryKey: ['nfts'] });
              }}
              className='mt-2 bg-red-600 hover:bg-red-700'
            >
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userNFTs.length === 0) {
    return (
      <Card className='w-full bg-slate-900/50 border-orange-500/30 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-orange-300'>
            {t('userNFTs.title', 'Your NFTs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-orange-400'>
            <Trans i18nKey="userNFTs.noNFTs">
              You do not own any OCTAAzyCube NFTs yet.
            </Trans>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Be defensive: filter out any null/undefined items before slicing
  const displayNfts = userNFTs.filter(Boolean).slice(0, displayCount);

  return (
    <div className="relative rounded-2xl bg-slate-900/50 border border-cyan-500/30 backdrop-blur-sm p-4 md:p-6">
      {/* Title and total count */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl md:text-2xl font-bold text-cyan-300'>
          {t('userNFTs.yourOCTAAzyCubeNFTs', 'Your OCTAAzyCube NFTs')}
        </h2>
        <Badge variant="outline" className='border-cyan-400/40 text-cyan-300 bg-cyan-900/30'>
          {userNFTs.length} {t('common.total', 'total')}
        </Badge>
      </div>

      {/* Grid of NFTs */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3'>
        {displayNfts.map((nft, idx) => {
          // Use a robust key without relying on contract fields (not present in our NFT type)
          const keyVal = nft.id ? `id-${nft.id}` : `tok-${nft.tokenId}-${idx}`;
          return (
            <NFTCard
              key={keyVal}
              nft={nft}
              pingInterval={pingInterval && pingInterval > 0 ? pingInterval : null}
              breedCooldown={breedCooldown && breedCooldown > 0 ? breedCooldown : null}
            />
          );
        })}
      </div>

      {/* "Show More" button */}
        {userNFTs.length > displayCount && (
          <div className='mt-4 text-center'>
            <Button variant="link" onClick={() => setDisplayCount(prev => prev + 14)} className="text-cyan-400">
              {t('userNFTs.showMore', 'Show More...')}
            </Button>
          </div>
        )}

      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-30 animate-pulse -z-10 pointer-events-none"></div>
    </div>
  );
}

interface NFTCardProps {
  nft: NFTType;
  pingInterval: number | null;
  breedCooldown: number | null;
}

function NFTCard({ nft, pingInterval, breedCooldown }: NFTCardProps) {
  const { t } = useTranslation();
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  // Use centralised hook (same as Burn section) to always fetch initialStars/rarity
  // Pass a safe decimal tokenId string (our NFT type already has numeric tokenId)
  const { nftInfo, isLoading: stateLoading } = useNFTContractInfo(String(nft.tokenId));

  const initialStars = nftInfo ? nftInfo.static.initialStars : (nft.stars ?? 0);
  const currentStars = nftInfo
    ? nftInfo.dynamic.currentStars
    : (nft.stars ?? 0);
  const lockedOcta = nftInfo
    ? (() => {
        try {
          const rewardWei = nftInfo.dynamic.lockedOcta;
          const rewardEther = Number(formatEther(rewardWei));
          if (!Number.isFinite(rewardEther) || rewardEther < 0 || rewardEther > 1e12) {
            return 0;
          }
          return rewardEther;
        } catch {
          return 0;
        }
      })()
    : 0;
  const lastPing = nftInfo ? Number(nftInfo.dynamic.lastPingTime) : 0;
  const lastBreed = nftInfo ? Number(nftInfo.dynamic.lastBreedTime) : 0;

  const rarityLabel = getRarityLabel(initialStars);
  const rarityColorClass = getRarityColor(initialStars);

  const effectivePingInterval = typeof pingInterval === 'number' && pingInterval > 0 ? pingInterval : null;
  const effectiveBreedCooldown = typeof breedCooldown === 'number' && breedCooldown > 0 ? breedCooldown : null;

  const pingReady =
    effectivePingInterval != null ? nowSec > lastPing + effectivePingInterval : false;
  const breedReady =
    effectiveBreedCooldown != null ? nowSec > lastBreed + effectiveBreedCooldown : false;
  const burnable =
    lockedOcta > 0 && !(nftInfo ? nftInfo.dynamic.isInGraveyard : false);

  // Update time every 5 seconds for countdowns
  useEffect(() => {
    const timer = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className='relative group rounded-lg border border-slate-700 bg-slate-800/50 p-2 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1'
      layout
    >
      {/* NFT Image */}
      <div className='relative mb-1.5 aspect-square'>
        <IpfsImage
          src={nft.image}
          alt={nft.name || `NFT #${nft.tokenId}`}
          className='w-full h-full object-cover rounded-md'
        />
        {/* Rarity Badge */}
        {(() => {
          return (
            <div className='absolute top-0.5 right-0.5'>
              <Badge variant="outline"
                className={`${rarityColorClass} text-white text-xs px-1 py-0`}
              >
                {rarityLabel}
              </Badge>
            </div>
          );
        })()}
      </div>

      {/* NFT Info */}
      <div className='space-y-1 text-xs'>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>ID:</span>
          <span className='text-cyan-300 font-mono'>#{nft.tokenId}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Stars:</span>
          {stateLoading ? (
            <Skeleton className='h-3 w-12 bg-slate-700' />
          ) : (
            <span className='text-yellow-400 font-mono'>
              {'⭐'.repeat(Math.max(1, currentStars))}
            </span>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>{t('labels.lockedOcta', 'Locked OCTAA')}:</span>
          {stateLoading ? (
            <Skeleton className='h-3 w-12 bg-slate-700' />
          ) : (
            <span className='text-green-400'>
              {lockedOcta >= 1e12
                ? `${(lockedOcta / 1e12).toFixed(2)}T`
                : lockedOcta >= 1e9
                  ? `${(lockedOcta / 1e9).toFixed(2)}B`
                  : lockedOcta >= 1e6
                    ? `${(lockedOcta / 1e6).toFixed(2)}M`
                    : lockedOcta >= 1e3
                      ? `${(lockedOcta / 1e3).toFixed(2)}K`
                      : lockedOcta.toFixed(2)}
            </span>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Ping:</span>
          <span className={pingReady ? 'text-green-400' : 'text-orange-400'}>
            {pingReady
              ? t('status.ready', 'Ready')
              : `⏳ ${effectivePingInterval ? formatDuration(lastPing + effectivePingInterval - nowSec) : ''}`}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>Breed:</span>
          <span className={breedReady ? 'text-green-400' : 'text-orange-400'}>
            {breedReady
              ? t('status.ready', 'Ready')
              : `⏳ ${effectiveBreedCooldown ? formatDuration(lastBreed + effectiveBreedCooldown - nowSec) : ''}`}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-slate-400'>
            {t('nft.burnable', 'Burnable')}:
          </span>
          <span className={burnable ? 'text-red-400' : 'text-slate-500'}>
            {burnable ? `🔥 ${t('status.burnable', 'Burnable')}` : '—'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
