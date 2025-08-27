import { useEffect, useState, memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShatterImage } from './shatter-image';
import { motion } from 'framer-motion';
import {
  useCrazyCubeGame,
  type NFTGameData,
  type BurnRecord,
} from '@/hooks/useCrazyCubeGame';
import { getLabel } from '@/lib/rarity';
import { Timer, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GraveyardCubeCardProps {
  tokenId: string;
  index: number;
}

export const GraveyardCubeCard = memo(function GraveyardCubeCard({
  tokenId,
  index,
}: GraveyardCubeCardProps) {
  const { getNFTGameData, getBurnRecord } = useCrazyCubeGame();
  const [gameData, setGameData] = useState<NFTGameData | null>(null);
  const [record, setRecord] = useState<BurnRecord | null>(null);
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const { t } = useTranslation();

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [data, rec] = await Promise.all([
        getNFTGameData(tokenId),
        getBurnRecord(tokenId),
      ]);
      if (!ignore) {
        setGameData(data);
        setRecord(rec);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [tokenId, getNFTGameData, getBurnRecord]);

  useEffect(() => {
    const id = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      60_000 // once per minute is enough
    );
    return () => clearInterval(id);
  }, []);

  const imgIdx = (index % 9) + 1;
  const imageSrc = `/images/z${imgIdx}.png`;

  const brightness = 1 + (Math.floor(index / 9) % 6) * 0.07;

  const brTime = record?.graveyardReleaseTime ?? 0;
  const clTime = record?.claimAvailableTime ?? 0;
  const isReadyForBreed = brTime && now >= brTime;
  const isReadyForClaim = clTime && !record?.claimed && now >= clTime;

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}m ${s % 60}s`.replace(/^0m /, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 1) }}
      whileHover={{ scale: 1.05 }}
      layout='position' // 🔑 don't touch height
    >
      <Card className='w-[220px] h-[360px] bg-gradient-to-br from-gray-800/80 to-slate-800/80 border border-gray-600/30 hover:border-sky-400/40 flex flex-col'>
        <CardHeader className='p-0 relative'>
          <div
            className='aspect-square relative overflow-hidden rounded-lg'
            style={{ filter: `brightness(${brightness})` }}
          >
            <ShatterImage
              src={imageSrc}
              alt={`Cube #${tokenId}`}
              className='w-full h-full'
              explodeDuration={4.6}
              maxPieces={6}
              stillDelay={1}
              priority={index < 4}
            />
            <div className='absolute inset-0 bg-black/30 pointer-events-none' />
            {isReadyForBreed && (
              <span className='absolute top-1.5 right-1.5 bg-green-500/90 text-xs text-white px-1.5 py-0.5 rounded-full flex items-center'>
                <Timer className='w-2 h-2 mr-0.5' />
                Ready!
              </span>
            )}
          </div>
        </CardHeader>

        {/* reserve space for text == fixed height */}
        <CardContent className='flex-1 flex flex-col justify-evenly items-center py-2'>
          <p className='text-gray-300 text-sm'>Token #{tokenId}</p>
          <p className='text-amber-400 text-xs'>
            {getLabel(gameData?.rarity ?? 1)}
          </p>

          {/* status block (height ≈ 2 lines always) */}
          <div className='h-[40px] flex flex-col items-center justify-center text-xs space-y-0.5'>
            {isReadyForBreed ? (
              <span className='text-green-400 flex items-center'>
                <Timer className='w-2 h-2 mr-0.5' />
                {t('readyForBreeding', 'Ready for breeding!')}
              </span>
            ) : brTime ? (
              <span className='text-blue-400 flex items-center'>
                <Clock className='w-2 h-2 mr-0.5' />
                {fmt(brTime - now)}
              </span>
            ) : null}

            {record &&
              !record.claimed &&
              (isReadyForClaim ? (
                <span className='text-amber-400'>
                  💰 {t('claimReady', 'Claim ready!')}
                </span>
              ) : clTime ? (
                <span className='text-orange-400'>💰 {fmt(clTime - now)}</span>
              ) : null)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
