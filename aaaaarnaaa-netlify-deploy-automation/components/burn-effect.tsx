'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface BurnEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function BurnEffect({ isActive, onComplete }: BurnEffectProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
      onAnimationComplete={() => {
        if (onComplete) {
          setTimeout(onComplete, 3900); // Complete after 3.9 seconds (30% slower)
        }
      }}
    >
      <div className='relative'>
        {/* Central fire effect */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1, 1.5, 0.8, 1.8, 0] }}
          transition={{ duration: 3.9, ease: 'easeInOut' }}
          className='w-32 h-32 bg-gradient-radial from-yellow-400 via-orange-500 to-red-600 rounded-full'
        />

        {/* Flame particles - ОПТИМИЗАЦИЯ: уменьшено с 12 до 8 */}
        {[...Array(8)].map((_, i) => (
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
              duration: (2 + Math.random()) * 1.3,
              delay: Math.random() * 0.65,
              repeat: 2,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
          >
            <Flame
              className={`w-6 h-6 text-orange-400`}
              style={{
                filter: `hue-rotate(${Math.random() * 60}deg)`,
              }}
            />
          </motion.div>
        ))}

        {/* Sparks - ОПТИМИЗАЦИЯ: уменьшено с 20 до 12 */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`spark-${i}`}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 300],
              y: [0, -150 - Math.random() * 150],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: (1.5 + Math.random()) * 1.3,
              delay: Math.random() * 1.3,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full'
          />
        ))}

        {/* Central text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
          transition={{ duration: 3.9, times: [0, 0.3, 0.7, 1] }}
          className='absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center'
        >
          <h3 className='text-2xl font-bold text-orange-400 mb-2'>
            🔥 BURNING NFT 🔥
          </h3>
          <p className='text-white'>
            Your CrazyCube is being consumed by flames...
          </p>
        </motion.div>
      </div>

      {/* Background fire effects - ОПТИМИЗАЦИЯ: уменьшено с 8 до 6 */}
      <div className='absolute inset-0 pointer-events-none'>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`bg-fire-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0, 2, 4],
            }}
            transition={{
              duration: 5.2,
              delay: Math.random() * 2.6,
              ease: 'easeOut',
            }}
            className='absolute bg-gradient-radial from-orange-500/30 to-transparent rounded-full w-64 h-64'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
