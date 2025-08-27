'use client';

import { motion } from 'framer-motion';
import { Heart, Star, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BreedingEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function BreedingEffect({ isActive, onComplete }: BreedingEffectProps) {
  // Show 5 sequential images: /images/d1.png … /images/d5.png
  const stages = [
    '/images/d1.png',
    '/images/d2.png',
    '/images/d3.png',
    '/images/d4.png',
    '/images/d5.png',
  ];
  const [stageIdx, setStageIdx] = useState(0);

  // Start image change cycle when effect is activated
  useEffect(() => {
    if (!isActive) return;
    setStageIdx(0);
    const id = setInterval(() => {
      setStageIdx(i => {
        if (i >= stages.length - 1) {
          clearInterval(id);
          if (onComplete) setTimeout(onComplete, 500); // small pause
          return i;
        }
        return i + 1;
      });
    }, 500); // every 0.5s → full cycle ≈2.5s
    return () => clearInterval(id);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
    >
      <div className='relative flex flex-col items-center justify-center space-y-6'>
        {/* Central cube evolution */}
        <motion.img
          key={stageIdx}
          src={stages[stageIdx]}
          alt='Growing Cube'
          initial={{ scale: 0, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'backOut' }}
          className='w-48 h-48 object-contain rounded-lg shadow-lg'
        />

        {/* Heart pulse behind */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1, 1.4, 0] }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          className='absolute w-36 h-36 bg-gradient-radial from-pink-500/70 via-purple-600/50 to-transparent rounded-full'
        />

        {/* Love particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 200],
              y: [0, -100 - Math.random() * 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              repeat: 2,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Heart
              className={`w-6 h-6 text-pink-400`}
              style={{
                filter: `hue-rotate(${Math.random() * 60}deg)`,
              }}
            />
          </motion.div>
        ))}

        {/* Sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 300],
              y: [0, -150 - Math.random() * 150],
              opacity: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: Math.random() * 1,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Sparkles className='w-4 h-4 text-yellow-400' />
          </motion.div>
        ))}

        {/* Stars */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 250],
              y: [0, -120 - Math.random() * 120],
              opacity: [0, 1, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.8,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Star className='w-3 h-3 text-purple-300' />
          </motion.div>
        ))}

        {/* Central text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
          transition={{ duration: 3, times: [0, 0.3, 0.7, 1] }}
          className='text-center'
        >
          <h3 className='text-2xl font-bold text-pink-400 mb-2'>
            💕 BREEDING IN PROGRESS 💕
          </h3>
          <p className='text-white'>
            Two hearts become one... creating new life!
          </p>
        </motion.div>
      </div>

      {/* Background magical effects */}
      <div className='absolute inset-0 pointer-events-none'>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`bg-magic-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0, 2, 4],
            }}
            transition={{
              duration: 4,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
            className='absolute bg-gradient-radial from-purple-500/30 to-transparent rounded-full w-64 h-64'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Floating hearts background */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`floating-heart-${i}`}
          initial={{
            opacity: 0,
            y: '100vh',
            x: `${Math.random() * 100}vw`,
          }}
          animate={{
            opacity: [0, 0.7, 0],
            y: '-10vh',
            x: `${Math.random() * 100}vw`,
          }}
          transition={{
            duration: 6,
            delay: Math.random() * 3,
            ease: 'linear',
          }}
          className='absolute pointer-events-none'
        >
          <Heart className='w-8 h-8 text-pink-300/50' />
        </motion.div>
      ))}
    </motion.div>
  );
}
