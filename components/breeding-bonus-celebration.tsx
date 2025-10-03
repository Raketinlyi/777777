'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreedingBonusCelebrationProps {
  isVisible: boolean;
  bonusStars: number;
  newTokenId: string;
  onClose: () => void;
}

export function BreedingBonusCelebration({
  isVisible,
  bonusStars,
  newTokenId,
  onClose,
}: BreedingBonusCelebrationProps) {
  const [autoCloseTimer, setAutoCloseTimer] = useState(10);

  useEffect(() => {
    if (!isVisible) return;

    // Auto-close after 10 seconds
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
      setAutoCloseTimer(10);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
            className='relative max-w-4xl w-full mx-4 p-8 md:p-12'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              onClick={onClose}
              variant='ghost'
              size='icon'
              className='absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full'
            >
              <X className='w-6 h-6' />
            </Button>

            {/* Auto-close timer */}
            <div className='absolute top-4 left-4 text-white/60 text-sm'>
              Auto-close in {autoCloseTimer}s
            </div>

            {/* Celebration content */}
            <div className='text-center space-y-6'>
              {/* Animated stars background */}
              <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: Math.random() * window.innerWidth,
                      y: -20,
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      y: window.innerHeight + 20,
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

              {/* Main celebration message */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                className='relative z-10'
              >
                <div className='inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full mb-6 shadow-[0_0_60px_rgba(251,191,36,0.8)] animate-pulse'>
                  <Sparkles className='w-16 h-16 text-white' />
                </div>
              </motion.div>

              {/* Congratulations text */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className='space-y-4'
              >
                <h1 className='text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]'>
                  🎉 BONUS! 🎉
                </h1>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }}
                  className='space-y-2'
                >
                  <p className='text-3xl md:text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]'>
                    You received a RARE MUTATION!
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
                      +{bonusStars}
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
                      {[...Array(bonusStars)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.7 + i * 0.1,
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
                      STARS!
                    </motion.span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className='space-y-2 pt-4'
                >
                  <p className='text-xl md:text-2xl text-cyan-300 font-semibold'>
                    New NFT #{newTokenId}
                  </p>
                  <p className='text-lg text-white/80'>
                    Your cube has been blessed with extra stars! 🌟
                  </p>
                </motion.div>
              </motion.div>

              {/* Fireworks effect */}
              <div className='absolute inset-0 pointer-events-none overflow-hidden'>
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={`firework-${i}`}
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

              {/* Close button at bottom */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className='pt-8'
              >
                <Button
                  onClick={onClose}
                  size='lg'
                  className='bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] transition-all'
                >
                  Awesome! 🎊
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
