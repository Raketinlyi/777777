'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function GoldTreasure({ className = '' }: { className?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Main pile of gold */}
      <motion.div
        className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full'
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/*  */}
        <div className='absolute inset-0 bg-yellow-500/30 rounded-full blur-3xl'></div>

        {/*  */}
        <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-32 bg-gradient-to-t from-yellow-700 via-yellow-600 to-yellow-500 rounded-[50%] shadow-lg'></div>

        {/*  */}
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 w-56 h-28 bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400 rounded-[50%] shadow-lg'></div>

        {/*  */}
        <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-24 bg-gradient-to-t from-yellow-500 via-yellow-400 to-yellow-300 rounded-[50%] shadow-lg'></div>

        {/*  */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`pile-coin-${i}`}
            className='absolute'
            style={{
              bottom: `${5 + Math.random() * 25}px`,
              left: `${30 + Math.random() * 40}%`,
              zIndex: Math.floor(Math.random() * 10),
            }}
            animate={{
              y: [0, -2, 0],
              rotate: [0, Math.random() * 8 - 4, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          >
            <div className='relative w-8 h-8'>
              <div className='w-full h-full rounded-full bg-gradient-radial from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg'></div>
              <div className='absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-white/60 rounded-full blur-sm'></div>
            </div>
          </motion.div>
        ))}

        {/*  */}
        {Array.from({ length: 10 }).map((_, i) => {
          //
          const gemColors = [
            'from-blue-300 via-blue-400 to-blue-600', //
            'from-green-300 via-green-400 to-green-600', //
            'from-red-300 via-red-400 to-red-600', //
            'from-purple-300 via-purple-400 to-purple-600', //
            'from-cyan-300 via-cyan-400 to-cyan-600', //
          ];

          const colorClass =
            gemColors[Math.floor(Math.random() * gemColors.length)];

          return (
            <motion.div
              key={`gem-${i}`}
              className='absolute'
              style={{
                bottom: `${10 + Math.random() * 20}px`,
                left: `${20 + Math.random() * 60}%`,
                zIndex: Math.floor(Math.random() * 10) + 5,
              }}
              animate={{
                y: [0, -3, 0],
                rotate: [0, Math.random() * 10 - 5, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 3,
              }}
            >
              <div
                className={`w-6 h-6 bg-gradient-to-br ${colorClass} rounded-md transform rotate-45 shadow-lg`}
              >
                <div className='absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-sm'></div>
              </div>
            </motion.div>
          );
        })}

        {/* Sparkling highlights */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className='absolute w-2 h-2 bg-white rounded-full'
            style={{
              bottom: `${10 + Math.random() * 30}px`,
              left: `${20 + Math.random() * 60}%`,
              opacity: 0.7,
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>

      {/* ) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`falling-coin-${i}`}
          className='absolute'
          style={{
            top: `-${20 + Math.random() * 10}px`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, 300],
            x: [0, (Math.random() - 0.5) * 50],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 5,
            ease: 'easeIn',
          }}
        >
          <div className='relative w-8 h-8'>
            <div className='w-full h-full rounded-full bg-gradient-radial from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg'></div>
            <div className='absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-white/60 rounded-full blur-sm'></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
