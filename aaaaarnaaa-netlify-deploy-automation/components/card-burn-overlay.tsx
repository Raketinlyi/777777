'use client';

import { motion } from 'framer-motion';
import { FireEffect } from '@/components/fire-effect';

interface CardBurnOverlayProps {
  /** intensity: 1 = small, 2 = medium, 3 = big */
  level: 1 | 2 | 3;
}

export default function CardBurnOverlay({ level }: CardBurnOverlayProps) {
  // Map level to fire intensity multiplier
  const intensity = level === 1 ? 0.4 : level === 2 ? 0.8 : 1.2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='absolute inset-0 z-20 pointer-events-none rounded-lg overflow-hidden'
    >
      <FireEffect intensity={intensity} />
      {/* subtle darkening / burn vignette */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.8)_100%)]' />
    </motion.div>
  );
}
