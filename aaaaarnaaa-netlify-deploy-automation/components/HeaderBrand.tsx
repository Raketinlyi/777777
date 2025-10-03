'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrazyOctagon } from './CrazyOctagon';

/**
 * HeaderBrand: starts as a neon CRAZYCUBE wordmark; when it receives
 * window event 'crazycube:brand-switch', it plays an "explosion" and
 * switches to the CrazyOctagon brand (which is bigger).
 */
export default function HeaderBrand({ className }: { className?: string }) {
  const [mode, setMode] = React.useState<'wordmark' | 'octagon'>('wordmark');
  const [blastKey, setBlastKey] = React.useState(0);
  const [exploding, setExploding] = React.useState(false);

  React.useEffect(() => {
    const onSwitch = () => {
      if (mode === 'octagon') return;
      setExploding(true);
      setBlastKey((k) => k + 1);
      // After explosion, reveal octagon
      window.setTimeout(() => setMode('octagon'), 700);
      // Reset explosion flag later
      window.setTimeout(() => setExploding(false), 1200);
    };
    window.addEventListener('crazycube:brand-switch', onSwitch as EventListener);
    return () => window.removeEventListener('crazycube:brand-switch', onSwitch as EventListener);
  }, [mode]);

  const letters = 'CrazyCube'.split('');

  return (
    <div className={`relative flex items-center h-10 md:h-14 select-none ${className ?? ''}`}>
      <motion.div
        className="w-full h-full"
      >
        <AnimatePresence initial={false} mode="wait">
        {mode === 'wordmark' ? (
          <motion.div
            key={`wordmark-${blastKey}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
            className="flex items-end relative z-50"
          >
            <div className="relative z-50">
              <div className="absolute -inset-1 rounded-lg bg-fuchsia-500/10 blur-md" />
              <div className="relative flex gap-[0.08em] px-3 py-2 z-50">
                {letters.map((ch, i) => {
                  const r = (seed: number) => {
                    const x = Math.sin(seed * 12.9898) * 43758.5453;
                    return x - Math.floor(x);
                  };
                  const dir = r(i + blastKey) < 0.5 ? -1 : 1;
                  const dx = 14 + r(i + 1 + blastKey) * 36;
                  const dy = 6 + r(i + 2 + blastKey) * 18;
                  const rot = (r(i + 3 + blastKey) * 40 - 20) * dir;
                  return (
                    <motion.span
                      key={`${ch}-${i}`}
                      className="font-black tracking-[0.05em]"
                      style={{
                        fontSize: 'clamp(28.8px, 6.24vw, 57.6px)',
                        lineHeight: 1,
                        background: 'linear-gradient(90deg, #87ceeb, #00bfff, #1e90ff, #4169e1, #87ceeb)',
                        backgroundSize: '320% auto',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(135,206,235,0.95), 0 0 40px rgba(0,191,255,0.85), 0 0 60px rgba(30,144,255,0.7), 0 0 85px rgba(65,105,225,0.5)',
                      }}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        backgroundPosition: ['0% center', '100% center', '0% center'],
                      }}
                      transition={{ 
                        duration: 0.3, 
                        delay: i * 0.03,
                        backgroundPosition: {
                          duration: 8,
                          repeat: Infinity,
                          ease: 'linear'
                        }
                      }}
                      {...(exploding && {
                        animate: {
                          x: dir * dx,
                          y: -dy,
                          rotateZ: rot,
                          opacity: [1, 0.8, 0],
                        },
                        transition: { duration: 0.6, ease: 'easeOut' },
                      })}
                    >
                      {ch}
                    </motion.span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="octagon"
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <CrazyOctagon className="w-56 h-20 md:w-72 md:h-24" iconOnly />
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
