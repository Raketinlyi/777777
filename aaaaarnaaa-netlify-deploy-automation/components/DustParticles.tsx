'use client';

import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

interface DustParticlesProps {
  count?: number;
  isMobile?: boolean;
}

// Оптимизированный компонент пыли с мемоизацией
const DustParticles = memo(({ count, isMobile = false }: DustParticlesProps) => {
  // Мемоизация конфигурации частиц
  const particles = useMemo(() => {
    const particleCount = count || (isMobile ? 22 : 42);
    return Array.from({ length: particleCount }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 0.35 + Math.random() * (isMobile ? 0.5 : 0.9),
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 5,
      drift: (Math.random() - 0.5) * 40,
    }));
  }, [count, isMobile]);

  return (
    <div className='absolute inset-0 pointer-events-none z-30 overflow-hidden'>
      {particles.map(p => (
        <motion.span
          key={`dust-${p.id}`}
          className='absolute rounded-full bg-white/25 blur-sm'
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}rem`,
            height: `${p.size}rem`,
            willChange: 'transform, opacity', // GPU acceleration
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 0.35, 0],
            x: [0, p.drift * 0.5, p.drift],
            y: [0, -25 - p.drift * 0.2, 0],
            scale: [0.6, 1, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
});

DustParticles.displayName = 'DustParticles';

export default DustParticles;
