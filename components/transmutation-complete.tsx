'use client';

import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

interface TransmutationCompleteProps {
  isActive: boolean;
  craaAmount: string;
  onComplete?: () => void;
}

export function TransmutationComplete({ isActive, craaAmount, onComplete }: TransmutationCompleteProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'
      onAnimationComplete={() => {
        if (onComplete) {
          setTimeout(onComplete, 4000); // Complete after 4 seconds
        }
      }}
    >
      <div className='relative text-center max-w-md mx-4'>
        {/* Energy vortex - more intense */}
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: [0, 1.5, 1.2],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 1.5,
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            rotate: { repeat: Infinity, duration: 4, ease: 'linear' }
          }}
          className='w-64 h-64 rounded-full mx-auto mb-8'
          style={{
            background: 'radial-gradient(circle, #c084fc, #a855f7, #7e22ce, #581c87, #000)',
            filter: 'blur(8px)',
            boxShadow: '0 0 60px #c084fc, 0 0 100px #a855f7',
          }}
        />
        
        {/* Disintegration particles - more dramatic */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{
              scale: 1,
              x: 0,
              y: 0,
              opacity: 1,
            }}
            animate={{
              scale: [1, 0],
              x: [0, (Math.random() - 0.5) * 400],
              y: [0, (Math.random() - 0.5) * 400],
              opacity: [1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 w-2 h-2 rounded-full'
            style={{
              transform: 'translate(-50%, -50%)',
              background: `hsl(${240 + Math.random() * 60}, 100%, 70%)`,
              boxShadow: `0 0 10px hsl(${240 + Math.random() * 60}, 100%, 70%)`,
            }}
          />
        ))}

        {/* Central icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1.5, 1.2],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 1,
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
          }}
          className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        >
          <Zap className='w-20 h-20 text-yellow-300' style={{ filter: 'drop-shadow(0 0 10px #fde047)' }} />
        </motion.div>

        {/* Energy waves - expanding circles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ 
              scale: 2,
              opacity: 0
            }}
            transition={{
              duration: 2,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            className='absolute top-1/2 left-1/2 rounded-full border-2 border-purple-500'
            style={{
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              boxShadow: '0 0 20px #c084fc',
            }}
          />
        ))}

        {/* Sparkles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{
              opacity: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 500],
              y: [0, (Math.random() - 0.5) * 500],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2'
            style={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Sparkles className='w-5 h-5 text-white' />
          </motion.div>
        ))}

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='relative z-10'
        >
          <h2 className='text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4'>
            TRANSMUTATION COMPLETE!
          </h2>
          <div className='bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 mb-6'>
            <p className='text-purple-200 mb-2'>
              Your NFT has been successfully converted to pure energy
            </p>
            <div className='flex items-center justify-center gap-2 text-3xl font-bold text-yellow-300'>
              <Zap className='w-8 h-8' />
              <span>{craaAmount} CRAA</span>
              <Zap className='w-8 h-8' />
            </div>
            <p className='text-sm text-purple-300 mt-2'>
              Energy sent to graveyard. Claim after waiting period.
            </p>
          </div>
          <motion.p 
            className='text-purple-300 text-lg'
            animate={{ 
              textShadow: [
                '0 0 5px #c084fc',
                '0 0 20px #c084fc',
                '0 0 5px #c084fc'
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            The cosmic forces are now working in your favor!
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}