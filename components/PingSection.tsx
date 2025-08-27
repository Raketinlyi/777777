'use client';

import React, { useState } from 'react';
import {
  useUserNFTs,
  getTokenIdAsDecimal,
  getNFTImage,
  getNFTName,
} from '@/hooks/useUserNFTs';
import { useMultipleNFTGameInfo } from '@/hooks/useNFTGameData';
import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRarityColor as rarityColor, getRarityLabel } from '@/lib/rarity';
import { useTranslation } from 'react-i18next';
import { useNetwork } from '@/hooks/use-network';
import DOMPurify from 'isomorphic-dompurify';

interface PingableNFTProps {
  nft: { id: { tokenId: string } };
  gameInfo?: { 
    canPing?: boolean; 
    isActivated?: boolean; 
    rarity?: number; 
    currentStars?: number; 
    lockedCRAAFormatted?: string;
    [key: string]: unknown 
  } | undefined;
  onPing: (tokenId: string) => void;
  isLoading: boolean;
}

const PingableNFT = ({
  nft,
  gameInfo,
  onPing,
  isLoading,
}: PingableNFTProps) => {
  const { isApeChain, requireApeChain } = useNetwork();
  const { t } = useTranslation();

  const formatTimeLeft = (seconds: number): string => {
    if (seconds === 0) return t('status.ready', 'Ready!');
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getRarityBonus = (rarity: number) => {
    // Read from contract instead of hardcoded values
    // Contract values: [0, 5, 10, 15, 20, 25] %
    const contractBonuses = [0, 0, 5, 10, 15, 20, 25];
    return contractBonuses[rarity] || 0;
  };

  const canPing = gameInfo?.canPing && !isLoading;

  return (
    <motion.div
      whileHover={{ scale: canPing ? 1.02 : 1 }}
      whileTap={{ scale: canPing ? 0.98 : 1 }}
    >
      <Card
        className={`transition-all duration-200 ${
          canPing
            ? 'border-blue-500/30 bg-slate-900/50 hover:border-blue-500/50 cursor-pointer'
            : 'border-slate-600/30 bg-slate-800/30 opacity-60'
        }`}
        onClick={requireApeChain(() => onPing(nft.id.tokenId))}
      >
        <CardContent className='p-4'>
          <div className='relative'>
            <img
              src={getNFTImage(nft as any)}
              alt={getNFTName(nft as any)}
              className='w-full h-40 object-cover rounded-lg mb-3'
            />

            {/* Status badges */}
            <div className='absolute top-2 left-2 flex flex-col gap-1'>
              {gameInfo?.isActivated && (
                <Badge className='bg-green-500/80 text-white text-xs'>
                  <Star className='w-3 h-3 mr-1' />
                  Active
                </Badge>
              )}
              <Badge
                className={`${rarityColor(gameInfo?.rarity || 1)}/80 text-white text-xs`}
              >
                {getRarityLabel(gameInfo?.rarity || 1)}
              </Badge>
            </div>

            {/* Stars and locked CRAA */}
            <div className='absolute top-2 right-2 flex flex-col gap-1'>
              <Badge className='bg-yellow-500/80 text-black font-bold text-xs'>
                ⭐ {gameInfo?.currentStars || 0}
              </Badge>
              {gameInfo && gameInfo.lockedCRAAFormatted && parseFloat(gameInfo.lockedCRAAFormatted) > 0 && (
                <Badge className='bg-green-500/80 text-white text-xs'>
                  💰{' '}
                  {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }).format(parseFloat(gameInfo.lockedCRAAFormatted))}
                </Badge>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='font-semibold text-blue-100 text-sm truncate'>
              {getNFTName(nft)}
            </h4>

            <div className='flex justify-between text-xs'>
              <span className='text-slate-400'>Rarity:</span>
              <span className='text-blue-300'>
                {gameInfo?.rarity || 'N/A'} (+
                {getRarityBonus(gameInfo?.rarity || 1)}%)
              </span>
            </div>

            <div className='flex justify-between text-xs'>
              <span className='text-slate-400'>Locked CRAA:</span>
              <span className='text-green-300'>
                {gameInfo
                  ? new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(parseFloat(gameInfo.lockedCRAAFormatted || '0'))
                  : '0.00'}
              </span>
            </div>

            {/* Ping status and button */}
            <div className='mt-3'>
              {gameInfo?.canPing ? (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    onPing(nft.id.tokenId);
                  }}
                  disabled={!isApeChain || isLoading}
                  className='w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs py-2'
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className='w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-2'
                    />
                  ) : (
                    <Zap className='w-3 h-3 mr-2' />
                  )}
                  Ping NFT
                </Button>
              ) : gameInfo?.pingCooldown && typeof gameInfo.pingCooldown === 'number' && gameInfo.pingCooldown > 0 ? (
                <Button disabled className='w-full text-xs py-2'>
                  <Clock className='w-3 h-3 mr-2' />
                  {formatTimeLeft(gameInfo.pingCooldown)}
                </Button>
              ) : (
                <Button disabled className='w-full text-xs py-2'>
                  <AlertCircle className='w-3 h-3 mr-2' />
                  {!gameInfo?.isActivated ? 'Not Activated' : "Can't Ping"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const PingSection = () => {
  const { nfts, loading: isLoadingNfts, error: nftsError } = useUserNFTs();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Get game info for all NFTs
  const tokenIds = nfts.map(nft => nft.id.tokenId);
  const { nftInfos, isLoading: isLoadingGameInfo } =
    useMultipleNFTGameInfo(tokenIds);

  const {
    pingNFT,
    craaBalance,
    isWritePending,
    isTxLoading,
    isTxSuccess,
    isTxError,
    txHash,
    writeError,
    txError,
  } = useCrazyCubeGame();

  const handlePing = async (tokenId: string) => {
    try {
      await pingNFT(tokenId);
      toast({
        title: 'Ping Initiated! ⚡',
        description: `Ping transaction sent for NFT #${tokenId}. You'll earn CRAA based on rarity!`,
      });
    } catch (error: any) {
      toast({
        title: 'Ping Failed',
        description: DOMPurify.sanitize(error.message || 'Failed to ping NFT'),
        variant: 'destructive',
      });
    }
  };

  // Filter pingable NFTs
  const pingableNfts = nfts.filter(nft => {
    const gameInfo = nftInfos.find(info => info.tokenId === nft.id.tokenId);
    return gameInfo?.isActivated && !gameInfo?.isInGraveyard;
  });

  if (isLoadingNfts || isLoadingGameInfo) {
    return (
      <div className='flex justify-center items-center py-12'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full'
        />
        <span className='ml-3 text-blue-300'>Loading your Crazy Cubes...</span>
      </div>
    );
  }

  if (nftsError) {
    return (
      <div className='text-center py-12'>
        <AlertCircle className='w-12 h-12 text-red-400 mx-auto mb-4' />
        <div className='text-red-400 mb-2'>Error loading NFTs</div>
        <div className='text-slate-400'>{nftsError}</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <p className='text-slate-400 mb-4'>
          Ping your NFTs every 3 minutes to earn CRAA tokens! Ping once every 3
          minutes or once every 15 days, accumulation up to 15 days.
        </p>

        {/* Game stats */}
        <div className='flex justify-center gap-6 text-sm'>
          <div className='text-center'>
            <div className='text-blue-300 font-bold'>
              {new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(parseFloat(craaBalance))}{' '}
              CRAA
            </div>
            <div className='text-slate-400'>Your Balance</div>
          </div>
          <div className='text-center'>
            <div className='text-green-300 font-bold'>
              {pingableNfts.length}
            </div>
            <div className='text-slate-400'>Pingable NFTs</div>
          </div>
          <div className='text-center'>
            <div className='text-purple-300 font-bold'>3 min</div>
            <div className='text-slate-400'>Cooldown</div>
          </div>
        </div>
      </div>

      {/* Ping info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4'
      >
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-blue-300 mb-2'>
            How Ping Works
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div>
              <TrendingUp className='w-5 h-5 text-green-400 mx-auto mb-1' />
              <div className='text-green-300 font-bold'>Earn CRAA</div>
              <div className='text-slate-400'>Based on NFT rarity</div>
            </div>
            <div>
              <Clock className='w-5 h-5 text-yellow-400 mx-auto mb-1' />
              <div className='text-yellow-300 font-bold'>3 Min Cooldown</div>
              <div className='text-slate-400'>Between pings</div>
            </div>
            <div>
              <Star className='w-5 h-5 text-purple-400 mx-auto mb-1' />
              <div className='text-purple-300 font-bold'>Rarity Bonus</div>
              <div className='text-slate-400'>Higher rarity = more CRAA</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pingable NFTs grid */}
      {pingableNfts.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {pingableNfts.map(nft => {
            const gameInfo = nftInfos.find(
              info => info.tokenId === nft.id.tokenId
            );
            return (
              <PingableNFT
                key={nft.id.tokenId}
                nft={nft}
                gameInfo={gameInfo as any}
                onPing={handlePing}
                isLoading={isWritePending || isTxLoading}
              />
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center py-12'
        >
          <div className='text-6xl mb-4'>⚡</div>
          <h3 className='text-xl font-semibold text-blue-300 mb-2'>
            No Pingable NFTs
          </h3>
          <p className='text-slate-400'>
            Your NFTs need to be activated and not in the graveyard to ping.
          </p>
        </motion.div>
      )}

      {/* Transaction status */}
      {(isWritePending || isTxLoading) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'
        >
          <div className='flex justify-center items-center gap-2'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full'
            />
            <span className='text-blue-300'>
              {isWritePending
                ? t(
                    'sections.ping.waitingForWallet',
                    'Waiting for wallet confirmation...'
                  )
                : t('sections.ping.processingPing', 'Processing ping...')}
            </span>
          </div>
          {txHash && (
            <p className='text-xs text-slate-400 mt-2'>
              Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
          )}
        </motion.div>
      )}

      {isTxSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-green-500/10 border border-green-500/20 rounded-lg p-4'
        >
          <div className='text-green-400 text-lg'>⚡ Ping Successful!</div>
          <p className='text-sm text-slate-400 mt-1'>
            Your NFT has been pinged and CRAA earned!
          </p>
        </motion.div>
      )}

      {(writeError || txError || isTxError) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-red-500/10 border border-red-500/20 rounded-lg p-4'
        >
          <div className='text-red-400 text-lg'>❌ Ping Failed</div>
          <p className='text-sm text-slate-400 mt-1'>
            {String(writeError?.message || txError || 'Unknown error occurred')}
          </p>
        </motion.div>
      )}
    </div>
  );
};
