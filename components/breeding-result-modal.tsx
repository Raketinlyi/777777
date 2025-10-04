'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
import { useAlchemyNftsQuery } from '@/hooks/useAlchemyNftsQuery';
import { IpfsImage } from '@/components/IpfsImage';

interface BreedingResultModalProps {
  isVisible: boolean;
  newTokenId: string;
  bonusStars?: number; // 0 = no bonus, 3-5 = bonus stars
  onClose: () => void;
}

// Rarity names (1-based index matching contract)
const RARITY_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
  6: 'Mythic',
};

// Rarity colors (1-based index matching contract)
const RARITY_COLORS: Record<number, string> = {
  0: 'from-gray-400 to-gray-600',
  1: 'from-gray-400 to-gray-600',
  2: 'from-green-400 to-green-600',
  3: 'from-blue-400 to-blue-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-orange-400 to-orange-600',
  6: 'from-pink-400 to-pink-600',
};

const range = (count: number) => Array.from({ length: Math.max(0, count) }, (_, idx) => idx);

export function BreedingResultModal({
  isVisible,
  newTokenId,
  bonusStars = 0,
  onClose,
}: Readonly<BreedingResultModalProps>) {
  const [autoCloseTimer, setAutoCloseTimer] = useState(120); // 2 минуты
  const { getNFTGameData } = useCrazyOctagonGame();
  const { data: allNFTs = [] } = useAlchemyNftsQuery();
  
  const [nftData, setNftData] = useState<{
    image: string | null;
    name: string;
    rarity: number;
    baseStars: number;
    contractStars: number;
    bonusStars: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load NFT data
  useEffect(() => {
    if (!isVisible || !newTokenId) return;

    const loadNFTData = async () => {
      setIsLoading(true);
      try {
        // Get game data (rarity, stars)
        const gameData = await getNFTGameData(newTokenId);
        
        // Find NFT in collection for image
        const nft = allNFTs.find(n => n.tokenId.toString() === newTokenId);
        
        setNftData({
          image: nft?.image ?? null,
          name: nft?.name ?? `Cube #${newTokenId}`,
          rarity: gameData?.rarity ?? 0,
          baseStars: gameData?.initialStars ?? 0,
          contractStars: gameData?.currentStars ?? 0,
          bonusStars: gameData?.bonusStars ?? 0,
        });
      } catch (error) {
        console.error('Failed to load NFT data:', error);
        setNftData({
          image: null,
          name: `Cube #${newTokenId}`,
          rarity: 0,
          baseStars: 0,
          contractStars: 0,
          bonusStars: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTData();
  }, [isVisible, newTokenId, getNFTGameData, allNFTs]);

  useEffect(() => {
    if (!isVisible) return;

    // Auto-close after 2 minutes
    const timer = setInterval(() => {
      setAutoCloseTimer((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onClose]);

  // Reset timer when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setAutoCloseTimer(120); // 2 минуты
    }
  }, [isVisible]);

  const imageSrc = nftData?.image ?? '/icons/favicon-180x180.png';
  const fallbackBonusStars = bonusStars ?? 0;
  const contractBonusStars = nftData?.bonusStars;
  const displayBonusStars =
    typeof contractBonusStars === 'number'
      ? contractBonusStars
      : fallbackBonusStars;
  const baseStarsRaw = nftData?.baseStars ?? 0;
  const contractStarsRaw = nftData?.contractStars ?? 0;
  const normalizedBaseStars = Math.max(0, Math.floor(baseStarsRaw));
  const normalizedContractStars = Math.max(0, Math.floor(contractStarsRaw));
  const normalizedBonusStars = Math.max(0, Math.floor(displayBonusStars));
  const totalStars = Math.max(
    normalizedContractStars,
    normalizedBaseStars + normalizedBonusStars
  );
  const hasBonus = normalizedBonusStars > 0;
  const bonusOnlyCount = Math.max(totalStars - normalizedBaseStars, 0);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto py-8'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
            className='relative max-w-3xl w-full mx-4 p-6 md:p-8 my-auto'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - ВСЕГДА НАВЕРХУ */}
            <Button
              onClick={onClose}
              variant='ghost'
              size='icon'
              className='sticky top-0 right-0 ml-auto z-50 text-white hover:bg-white/20 rounded-full w-14 h-14 md:w-16 md:h-16 bg-black/80 backdrop-blur-sm border-2 border-white/30 shadow-xl mb-4 flex-shrink-0'
              aria-label='Close modal'
            >
              <X className='w-8 h-8 md:w-10 md:h-10' />
            </Button>

            {/* Auto-close timer */}
            <div className='absolute top-6 left-6 text-white/60 text-sm bg-black/60 px-2 py-1 rounded'>
              Auto-close in {autoCloseTimer}s
            </div>

            {/* Celebration content */}
            <div className='text-center space-y-6'>
              {/* Animated background effects */}
              {hasBonus && (
                <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                  {range(30).map((sparkleId) => (
                    <motion.div
                      key={`bonus-sparkle-${sparkleId}`}
                      initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                        y: -20,
                        opacity: 0,
                        scale: 0,
                      }}
                      animate={{
                        y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 20,
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1, 1, 0],
                        rotate: 360,
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        delay: Math.random() * 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className='absolute'
                    >
                      <Star
                        className='text-yellow-400'
                        fill='currentColor'
                        size={20 + Math.random() * 20}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* NFT Image - УМЕНЬШЕННЫЙ РАЗМЕР */}
              <motion.div
                initial={{ scale: 0, rotateY: -180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
                className='relative z-10 mb-4'
              >
                <div className={`relative mx-auto w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-4 ${
                  hasBonus 
                    ? 'border-yellow-400 shadow-[0_0_60px_rgba(251,191,36,0.8)]'
                    : 'border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.8)]'
                } animate-pulse`}>
                  {isLoading ? (
                    <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900'>
                      <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400'></div>
                    </div>
                  ) : (
                    <>
                      <IpfsImage
                        src={imageSrc}
                        alt={nftData?.name || `Cube #${newTokenId}`}
                        fill
                        sizes='(max-width: 768px) 320px, (max-width: 1024px) 384px, 448px'
                        className='object-contain'
                        priority
                        tokenId={newTokenId}
                      />
                      {/* Hologram effect overlay */}
                      <div className='absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-pulse pointer-events-none' />

                      {/* Bonus sparkle overlay */}
                      {hasBonus && (
                        <div className='absolute inset-0 pointer-events-none'>
                          {range(12).map((sparkleId) => (
                            <motion.div
                              key={`holo-sparkle-${sparkleId}`}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0],
                                x: [0, (Math.random() - 0.5) * 100],
                                y: [0, (Math.random() - 0.5) * 100],
                              }}
                              transition={{
                                duration: 2,
                                delay: Math.random() * 2,
                                repeat: Infinity,
                                repeatDelay: Math.random() * 3,
                              }}
                              className='absolute'
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                              }}
                            >
                              <Sparkles className='text-yellow-400' size={20} />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Stars showcase below the image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className='flex flex-col items-center gap-3'
              >
                <div className='inline-flex flex-wrap items-center justify-center gap-3 rounded-full bg-black/70 px-4 py-2 backdrop-blur-md border border-yellow-400/40 shadow-[0_0_30px_rgba(15,23,42,0.5)]'>
                  {totalStars > 0 ? (
                    range(totalStars).map((starIndex) => {
                      const isBonusStar = starIndex >= normalizedBaseStars;
                      const isFilled = starIndex < normalizedContractStars;
                      const baseClass = isBonusStar
                        ? 'text-pink-300 drop-shadow-[0_0_14px_rgba(244,114,182,0.9)]'
                        : 'text-yellow-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.9)]';
                      return (
                        <Star
                          key={`star-${newTokenId}-${starIndex}`}
                          className={`w-10 h-10 md:w-12 md:h-12 ${
                            isFilled ? baseClass : 'text-slate-600'
                          }`}
                          fill={isFilled ? 'currentColor' : 'transparent'}
                          strokeWidth={isFilled ? 0.8 : 1.6}
                          stroke={isBonusStar ? '#f472b6' : '#fbbf24'}
                        />
                      );
                    })
                  ) : (
                    <span className='text-sm font-semibold text-slate-200 uppercase tracking-widest'>
                      No stars yet
                    </span>
                  )}
                </div>
                {totalStars > 0 && (
                  <div className='text-xs md:text-sm text-white/80 font-semibold uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-3'>
                    <span className='text-yellow-200'>Base: {normalizedBaseStars}</span>
                    <span className='text-cyan-200'>Contract: {normalizedContractStars}</span>
                    {bonusOnlyCount > 0 && (
                      <span className='text-pink-200'>+{bonusOnlyCount} Bonus</span>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className='space-y-4'
              >
                <h1 className={`text-5xl md:text-7xl font-black text-transparent bg-clip-text ${
                  hasBonus
                    ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]'
                    : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]'
                }`}>
                  {hasBonus ? '🎉 RARE MUTATION! 🎉' : '💕 BREEDING SUCCESS! 💕'}
                </h1>

                {/* Bonus stars display */}
                {hasBonus && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }}
                    className='space-y-2'
                  >
                    <p className='text-3xl md:text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]'>
                      Genetic Anomaly Detected!
                    </p>
                    <div className='flex items-center justify-center gap-3 text-4xl md:text-6xl'>
                      <motion.span
                        animate={{
                          scale: [1, 1.3, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className='text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,1)]'
                      >
                        +{normalizedBonusStars}
                      </motion.span>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className='flex items-center gap-1'
                      >
                        {range(normalizedBonusStars).map((bonusIdx) => (
                          <motion.div
                            key={`bonus-ring-${newTokenId}-${bonusIdx}`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: 0.7 + bonusIdx * 0.1,
                              type: 'spring',
                              bounce: 0.6,
                            }}
                          >
                            <Star
                              className='text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,1)]'
                              fill='currentColor'
                              size={40}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                      <motion.span
                        animate={{
                          scale: [1, 1.3, 1],
                          rotate: [0, -10, 10, 0],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className='text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,1)]'
                      >
                        BONUS STARS!
                      </motion.span>
                    </div>
                  </motion.div>
                )}

                {/* NFT Info - Rarity and Stars */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: hasBonus ? 0.8 : 0.5, duration: 0.5 }}
                  className='space-y-4 pt-4'
                >
                  {/* NFT Name and ID */}
                  <div className='space-y-2'>
                    <p className='text-2xl md:text-3xl font-bold text-white'>
                      {nftData?.name || `Cube #${newTokenId}`}
                    </p>
                    <p className='text-lg text-cyan-300 font-mono'>
                      Token ID: #{newTokenId}
                    </p>
                  </div>

                  {/* Rarity Badge */}
                  {!isLoading && nftData && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: 'spring', bounce: 0.5 }}
                      className='inline-block'
                    >
                      <div className={`px-6 py-3 rounded-full bg-gradient-to-r ${RARITY_COLORS[nftData.rarity] || RARITY_COLORS[0]} text-white font-bold text-xl shadow-lg`}>
                        {RARITY_NAMES[nftData.rarity] || 'Common'}
                      </div>
                    </motion.div>
                  )}

                  {/* Stars Display */}
                  {!isLoading && nftData && totalStars > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: 'spring', bounce: 0.5 }}
                      className='flex items-center justify-center gap-2'
                    >
                      <span className='text-xl text-white font-semibold'>Stars:</span>
                      <div className='flex items-center gap-1'>
                        {range(totalStars).map((ringIdx) => (
                          <motion.div
                            key={`ring-${newTokenId}-${ringIdx}`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: 0.8 + ringIdx * 0.1,
                              type: 'spring',
                              bounce: 0.6,
                            }}
                          >
                            <Star
                              className='text-yellow-400'
                              fill='currentColor'
                              size={28}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && nftData && (
                    <div className='text-sm text-cyan-200 text-center space-y-1'>
                      <p>
                        Base stars: {normalizedBaseStars}
                        {hasBonus ? ` + bonus ${normalizedBonusStars}` : ''}
                      </p>
                      <p>Contract total: {totalStars}</p>
                    </div>
                  )}

                  {/* Success message */}
                  <p className='text-lg text-white/80 pt-2'>
                    {hasBonus 
                      ? `🎊 Rare genetic mutation detected! Your cube received +${normalizedBonusStars} bonus stars! 🌟`
                      : '💕 Your new cube has been successfully created! 🎊'
                    }
                  </p>
                </motion.div>
              </motion.div>

              {/* Fireworks effect for bonus */}
              {hasBonus && (
                <div className='absolute inset-0 pointer-events-none overflow-hidden'>
                  {range(20).map((fireworkIdx) => (
                    <motion.div
                      key={`firework-${newTokenId}-${fireworkIdx}`}
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                        opacity: 1,
                      }}
                      animate={{
                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                        y: `${50 + (Math.random() - 0.5) * 100}%`,
                        scale: [0, 1, 0],
                        opacity: [1, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 1 + Math.random() * 2,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 3,
                      }}
                      className='absolute w-2 h-2 rounded-full'
                      style={{
                        background: [
                          '#fbbf24',
                          '#f59e0b',
                          '#ec4899',
                          '#8b5cf6',
                          '#06b6d4',
                        ][Math.floor(Math.random() * 5)],
                        boxShadow: '0 0 10px currentColor',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Close button at bottom */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: hasBonus ? 1 : 0.7, duration: 0.5 }}
                className='pt-8'
              >
                <Button
                  onClick={onClose}
                  size='lg'
                  className={`font-bold text-xl px-12 py-6 rounded-full transition-all ${
                    hasBonus
                      ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400 shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:shadow-[0_0_40px_rgba(251,191,36,0.8)]'
                      : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)]'
                  } text-white`}
                >
                  {hasBonus ? 'Awesome! 🎊' : 'Great! 💕'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
