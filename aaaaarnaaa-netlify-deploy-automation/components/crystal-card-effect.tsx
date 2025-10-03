'use client';

import { motion } from 'framer-motion';

interface CrystalCardEffectProps {
  intensity?: number; // 0.3 - 1.2 typical
  className?: string;
}

// Lightweight crystal shards overlay for card-sized previews
export function CrystalCardEffect({ intensity = 1, className = '' }: CrystalCardEffectProps) {
  const shardCount = Math.max(8, Math.floor(14 * intensity));
  const flakeCount = Math.max(10, Math.floor(24 * intensity));

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* cool tint */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(191,219,254,0.06)_0%,rgba(99,102,241,0.08)_60%,rgba(2,6,23,0.35)_100%)] mix-blend-screen' />

      {/* shards */}
      {Array.from({ length: shardCount }).map((_, i) => {
        const angle = (i / shardCount) * Math.PI * 2;
        const dist = 6 + (i % 5) * (2 + intensity * 1.5);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const rot = (i * 28) % 360;
        const delay = 0.05 + (i % 5) * 0.03;
        return (
          <motion.div
            key={`cshard-${i}`}
            initial={{ opacity: 0, scale: 0.2, x: 0, y: 0, rotate: rot }}
            animate={{
              opacity: [0, 0.9, 0],
              scale: [0.2, 1, 0.8],
              x: [0, x * (4 + intensity), x * (7 + intensity)],
              y: [0, y * (4 + intensity), y * (7 + intensity)],
              rotate: [rot, rot + 20, rot + 50],
            }}
            transition={{ duration: 1 + 0.8 * intensity, delay, ease: 'easeOut' }}
            className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          >
            <div
              className='w-2.5 h-4'
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                background:
                  'linear-gradient(180deg, rgba(219,234,254,0.95), rgba(199,210,254,0.85), rgba(15,23,42,0.1))',
                boxShadow: '0 0 6px rgba(191,219,254,0.35)',
              }}
            />
          </motion.div>
        );
      })}

      {/* flakes */}
      {Array.from({ length: flakeCount }).map((_, i) => (
        <motion.div
          key={`cflake-${i}`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 120],
            y: [0, -40 - Math.random() * 60],
          }}
          transition={{ duration: 0.8 + Math.random() * 0.9, delay: Math.random() * 0.4, ease: 'easeOut' }}
          className='absolute left-1/2 top-1/2 w-0.5 h-0.5 rounded-full'
          style={{
            background: 'rgba(226,232,240,0.9)',
            boxShadow: '0 0 4px rgba(191,219,254,0.55)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* faint edge frost */}
      <div className='absolute inset-0 rounded-lg border border-indigo-200/10 shadow-[inset_0_0_20px_rgba(191,219,254,0.12)]' />
    </div>
  );
}
