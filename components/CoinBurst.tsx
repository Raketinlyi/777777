'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface CoinBurstProps {
  children: React.ReactNode;
  onBurstEnd?: () => void;
  total?: number;
  duration?: number;
}

export default function CoinBurst({
  children,
  onBurstEnd,
  total = 24,
  duration = 0.65,
}: CoinBurstProps) {
  const [active, setActive] = useState(false);

  const fire = () => {
    if (active) return;
    setActive(true);
    setTimeout(() => {
      setActive(false);
      onBurstEnd?.();
    }, duration * 1000);
  };

  return (
    <span style={{ display: 'contents' }}>
      <span onClick={fire}>{children}</span>
      <AnimatePresence>
        {active && (
          <span className='absolute inset-0 pointer-events-none z-30'>
            {Array.from({ length: total }).map((_, i) => {
              const angle = (360 / total) * i + Math.random() * 15;
              const dist = 110 + Math.random() * 40;
              const x = dist * Math.cos((angle * Math.PI) / 180);
              const y = dist * Math.sin((angle * Math.PI) / 180);
              return (
                <motion.div
                  key={i}
                  className='absolute left-1/2 top-1/2 w-6 h-6 pointer-events-none select-none'
                  style={{ translateX: '-50%', translateY: '-50%' }}
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ x, y, rotate: 540, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ duration, ease: 'easeOut' }}
                >
                  <Image
                    src='/images/coin-blue.png'
                    alt='coin'
                    width={24}
                    height={24}
                    draggable={false}
                    priority
                  />
                </motion.div>
              );
            })}
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function HeartBurst({
  children,
  onBurstEnd,
  total = 18,
  duration = 0.8,
}: CoinBurstProps) {
  const [active, setActive] = useState(false);

  const fire = () => {
    if (active) return;
    setActive(true);
    setTimeout(() => {
      setActive(false);
      onBurstEnd?.();
    }, duration * 1000);
  };

  return (
    <div className='relative inline-block' onClick={fire}>
      {children}
      <AnimatePresence>
        {active &&
          Array.from({ length: total }).map((_, i) => {
            const angle = (360 / total) * i + Math.random() * 15;
            const dist = 110 + Math.random() * 40;
            const x = dist * Math.cos((angle * Math.PI) / 180);
            const y = dist * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.div
                key={i}
                className='absolute left-1/2 top-1/2 w-6 h-6 pointer-events-none select-none'
                style={{ translateX: '-50%', translateY: '-50%' }}
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ x, y, rotate: 540, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration, ease: 'easeOut' }}
              >
                {/* SVG heart from heart-rain.tsx */}
                <svg
                  width={24}
                  height={24}
                  viewBox='0 0 32 29'
                  fill='#fb7185'
                  xmlns='http://www.w3.org/2000/svg'
                  style={{ display: 'block' }}
                >
                  <path d='M23.6 0c3.9 0 7.1 3.1 7.1 7 0 7.4-13.3 16.9-15.7 18.5-.3.2-.7.2-1 0C11.6 23.9-1.7 14.4-1.7 7  -1.7 3.1 1.6 0 5.5 0 8 0 10.2 1.2 12 3.1 13.8 1.2 16 0 18.5 0' />
                </svg>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
