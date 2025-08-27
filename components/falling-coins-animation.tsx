'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FallingCoinsAnimationProps {
  intensity?: number;
  className?: string;
}

export function FallingCoinsAnimation({
  intensity = 1,
  className = '',
}: FallingCoinsAnimationProps) {
  const [isClient, setIsClient] = useState(false);
  const [coins, setCoins] = useState<
    Array<{
      id: number;
      delay: number;
      x: number;
      size: number;
      rotation: number;
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Generate coins
    const coinCount = Math.floor(40 * intensity);
    const newCoins = Array.from({ length: coinCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      x: Math.random() * 100, // X position (in percentage)
      size: Math.random() * 20 + 20, //  20-40px
      rotation: Math.random() * 360, // Initial rotation angle
    }));

    setCoins(newCoins);
  }, [isClient, intensity]);

  if (!isClient) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    >
      {coins.map(coin => (
        <motion.div
          key={coin.id}
          className='absolute top-0'
          style={{
            left: `${coin.x}%`,
            width: coin.size,
            height: coin.size,
          }}
          initial={{ y: '-10%', opacity: 0, rotate: coin.rotation }}
          animate={{
            y: ['0%', '110%'], // Falling from top to bottom
            opacity: [0, 1, 1, 0.8, 0],
            rotate: [
              coin.rotation,
              coin.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
            ],
            x: [0, (Math.random() - 0.5) * 50], //
          }}
          transition={{
            duration: 4 + Math.random() * 4, // 4-8 seconds for falling
            delay: coin.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: Math.random() * 2,
            ease: 'easeIn', // Acceleration effect when falling
          }}
        >
          <div className='relative w-full h-full'>
            {/*  */}
            <div className='absolute inset-0 rounded-full bg-yellow-300 opacity-70 animate-pulse'></div>
            {/*  */}
            <div className='absolute inset-0 rounded-full bg-yellow-500/30 blur-md'></div>

            {/*  */}
            <div className='w-full h-full relative'>
              <div className='absolute inset-0 rounded-full bg-gradient-radial from-yellow-400 via-yellow-500 to-yellow-700 shadow-lg'></div>
              <div className='absolute inset-1 rounded-full bg-gradient-radial from-yellow-300 via-yellow-400 to-yellow-600'></div>
              <div className='absolute inset-[15%] rounded-full bg-gradient-radial from-yellow-200 via-yellow-300 to-yellow-400'></div>
              <div className='absolute top-1/4 left-1/4 w-1/5 h-1/5 bg-white/60 rounded-full blur-sm'></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
