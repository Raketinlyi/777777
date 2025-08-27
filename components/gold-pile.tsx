'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function GoldPile({ className = '' }: { className?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Array of gold coin and treasure images
  const goldImages = [
    '/images/cra-token.png', // Main CRAA coin
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Main gold pile */}
      <motion.div
        className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-32'
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className='relative w-full h-full'>
          {/* Golden glow */}
          <div className='absolute inset-0 bg-yellow-500/30 rounded-full blur-3xl'></div>

          {/* Pile of coins */}
          <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-24 bg-yellow-600 rounded-full'></div>
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-yellow-500 rounded-full'></div>
          <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-yellow-400 rounded-full'></div>

          {/* Individual coins */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`pile-coin-${i}`}
              className='absolute'
              style={{
                bottom: `${10 + Math.random() * 20}px`,
                left: `${20 + Math.random() * 60}%`,
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
              <div className='relative w-10 h-10'>
                <div className='absolute inset-0 rounded-full bg-yellow-300 opacity-70 animate-pulse'></div>
                <Image
                  src={goldImages[0] || '/placeholder.svg'}
                  alt='Gold Coin'
                  width={40}
                  height={40}
                  className='object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Falling coins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`falling-coin-${i}`}
          className='absolute'
          style={{
            top: `-${20 + Math.random() * 10}px`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, 300],
            x: [0, (Math.random() - 0.5) * 80],
            rotate: [0, 360 * (Math.random() > 0.5 ? 0.7 : -0.7)],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 5,
            ease: 'easeIn',
          }}
        >
          <div className='relative w-8 h-8'>
            <div className='absolute inset-0 rounded-full bg-yellow-300 opacity-70 animate-pulse'></div>
            <Image
              src={goldImages[0] || '/placeholder.svg'}
              alt='Falling Gold Coin'
              width={32}
              height={32}
              className='object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
