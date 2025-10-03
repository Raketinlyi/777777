'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface PlasmaEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function PlasmaEffect({ isActive, onComplete }: PlasmaEffectProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
      onAnimationComplete={() => {
        if (onComplete) {
          setTimeout(onComplete, 3000); // Complete after 3 seconds
        }
      }}
    >
      <div className='relative'>
        {/* Central plasma vortex */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1.5, 1, 1.8, 0.5, 2.2, 0],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ duration: 3, ease: 'easeInOut' }}
          className='w-32 h-32 rounded-full'
          style={{
            background: 'radial-gradient(circle, #7c3aed, #4f46e5, #06b6d4)',
            filter: 'blur(8px)',
          }}
        />

        {/* Energy particles */}
        {[...Array(15)].map((_, i) => (
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
              x: [0, (Math.random() - 0.5) * 250],
              y: [0, -120 - Math.random() * 120],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.5 + Math.random(),
              delay: Math.random() * 0.5,
              repeat: 2,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full'
            style={{
              width: Math.random() * 10 + 5,
              height: Math.random() * 10 + 5,
              background: `hsl(${220 + Math.random() * 60}, 100%, 60%)`,
              boxShadow: `0 0 10px hsl(${220 + Math.random() * 60}, 100%, 60%)`,
            }}
          />
        ))}

        {/* Electric arcs */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`arc-${i}`}
            initial={{
              opacity: 0,
              scaleX: 0,
            }}
            animate={{
              opacity: [0, 1, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: Math.random() * 1,
              ease: 'easeOut',
            }}
            className='absolute top-1/2 left-1/2 h-0.5 origin-left'
            style={{
              width: 100 + Math.random() * 100,
              transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`,
              background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #06b6d4)',
              filter: 'blur(1px)',
            }}
          />
        ))}

        {/* Central icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: [0, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 1,
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            rotate: { repeat: Infinity, duration: 4, ease: 'linear' }
          }}
          className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        >
          <Zap className='w-12 h-12 text-cyan-300' />
        </motion.div>

        {/* Central text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
          transition={{ duration: 3, times: [0, 0.3, 0.7, 1] }}
          className='absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center'
        >
          <h3 className='text-2xl font-bold text-cyan-300 mb-2'>
            ⚡ TRANSMUTING NFT ⚡
          </h3>
          <p className='text-white'>
            Your CrazyCube is being converted to pure energy...
          </p>
        </motion.div>
      </div>

      {/* Background plasma effects */}
      <div className='absolute inset-0 pointer-events-none'>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`bg-plasma-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.4, 0],
              scale: [0, 3, 5],
            }}
            transition={{
              duration: 4,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
            className='absolute rounded-full'
            style={{
              width: 100,
              height: 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35), rgba(79, 70, 229, 0.18), transparent)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}