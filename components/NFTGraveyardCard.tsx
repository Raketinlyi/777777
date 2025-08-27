import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Skull, TimerReset, Coins } from 'lucide-react';
import {
  AlchemyNFT,
  getNFTImage,
  getTokenIdAsDecimal,
} from '@/hooks/useUserNFTs';
import {
  useCrazyCubeGame,
  type BurnRecord,
  type NFTGameData,
} from '@/hooks/useCrazyCubeGame';
import { useToast } from '@/hooks/use-toast';

import { useTranslation } from 'react-i18next';

interface NFTGraveyardCardProps {
  nft: AlchemyNFT;
  index: number;
  onActionComplete?: () => void;
}

export default function NFTGraveyardCard({
  nft,
  index,
  onActionComplete,
}: NFTGraveyardCardProps) {
  const { t } = useTranslation();
  const tokenIdDec = getTokenIdAsDecimal(nft);
  const { getBurnRecord, claimBurnRewards, isConnected, getNFTGameData } =
    useCrazyCubeGame();
  const { toast } = useToast();
  const [burnRecord, setBurnRecord] = useState<BurnRecord | null>(null);
  const [gameData, setGameData] = useState<NFTGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchAll = async () => {
      const [br, gd] = await Promise.all([
        getBurnRecord(tokenIdDec),
        getNFTGameData(tokenIdDec),
      ]);
      if (!ignore) {
        setBurnRecord(br);
        setGameData(gd);
        setLoading(false);
      }
    };
    fetchAll();
    return () => {
      ignore = true;
    };
  }, [tokenIdDec]);

  const nowSec = Math.floor(Date.now() / 1000);
  const claimReady = burnRecord ? burnRecord.canClaim : false;
  const timeLeft = burnRecord ? burnRecord.timeLeft : 0;
  const getRarityLabel = (r: number) => {
    const map = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    return map[r] || 'Unknown';
  };
  const formatDuration = (sec: number): string => {
    if (sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim();
  };

  const handleClaim = async () => {
    if (!isConnected) {
      toast({
        title: t('wallet.notConnected', 'Connect wallet'),
        variant: 'destructive',
      });
      return;
    }
    if (!claimReady) return;
    try {
      setProcessing(true);
      await claimBurnRewards(tokenIdDec);
      toast({
        title: t(
          'graveyard.claimedReward',
          `Claimed reward for #${tokenIdDec}`
        ),
      });
      const br = await getBurnRecord(tokenIdDec);
      setBurnRecord(br);
      if (onActionComplete) onActionComplete();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Claim error';
      toast({
        title: t('graveyard.claimError', 'Claim error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className='scale-[0.9]'
    >
      <Card className='bg-gradient-to-br from-gray-800/80 to-slate-800/80 border border-gray-600/30 hover:border-gray-400/60'>
        <CardHeader>
          <div className='aspect-square relative overflow-hidden rounded-lg burned-img'>
            {getNFTImage(nft) ? (
              <Image
                src={getNFTImage(nft)}
                alt={`Cube #${tokenIdDec}`}
                width={200}
                height={200}
                className='w-full h-full object-cover grayscale brightness-75'
              />
            ) : (
              <div className='w-full h-full bg-gray-700 flex items-center justify-center' />
            )}
            <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
              <Skull className='w-10 h-10 text-red-600' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='text-center space-y-2'>
          <p className='text-gray-300 text-sm'>Token #{tokenIdDec}</p>
          {gameData && (
            <p className='text-xs text-amber-400'>
              {getRarityLabel(gameData.rarity)}
            </p>
          )}
          {loading ? (
            <div className='text-xs text-gray-400'>
              <Loader2 className='w-4 h-4 animate-spin inline' /> Loading
            </div>
          ) : (
            <>
              <p className='text-xs text-gray-400 flex items-center justify-center gap-1'>
                {claimReady ? (
                  <>
                    <Coins className='w-4 h-4' /> Reward ready
                  </>
                ) : (
                  <>
                    <TimerReset className='w-4 h-4' />{' '}
                    {formatDuration(timeLeft)}
                  </>
                )}
              </p>
              <Button
                disabled={!claimReady || processing}
                onClick={handleClaim}
                className='w-full bg-gradient-to-r from-slate-700 to-gray-700 hover:from-slate-600 hover:to-gray-600 text-white'
              >
                {processing ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : claimReady ? (
                  'Claim'
                ) : (
                  'Waiting'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
