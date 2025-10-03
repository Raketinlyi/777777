'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const COINS = 25;

interface CoinVariant {
  delay: number;
  duration: number;
  size: number;
  x: number;
}

export function CoinRain() {
  const [variants, setVariants] = useState<CoinVariant[]>([]);

  useEffect(() => {
    // generate only on client to avoid SSR mismatch
    const arr = Array.from({ length: COINS }).map(() => ({
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 4,
      size: 12 + Math.random() * 16,
      x: -50 + Math.random() * 100,
    }));
    setVariants(arr);
  }, []);

  if (variants.length === 0) return null;

  return (
    <div
      className='pointer-events-none fixed inset-0 overflow-hidden z-0'
      suppressHydrationWarning
    >
      {variants.map((v, i) => (
        <motion.div
          key={i}
          style={{
            width: v.size,
            height: v.size,
            left: `${50 + v.x}%`,
            top: -40,
            background:
              'radial-gradient(circle at 30% 30%, #fef08a 0%, #facc15 60%, #eab308 100%)',
            borderRadius: '50%',
            position: 'absolute',
          }}
          animate={{ y: '110vh', rotate: [0, 360] }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: v.duration,
            delay: v.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
