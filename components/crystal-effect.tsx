'use client';

import { motion } from 'framer-motion';

interface CrystalEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

// Non-fire alternative: "Crystalize & Shatter" overlay
// Visual: cold core pulse, crystal shards burst, fine snow particles
export function CrystalEffect({ isActive, onComplete }: CrystalEffectProps) {
  if (!isActive) return null;

  const DURATION = 3.2; // seconds

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/85'
      onAnimationComplete={() => {
        if (onComplete) setTimeout(onComplete, DURATION * 1000);
      }}
    >
      <div className='relative w-[340px] h-[340px]'>
        {/* Cold core pulse (glacial glow) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.2, 1.15, 0.95, 1.4] }}
          transition={{ duration: DURATION, times: [0, 0.25, 0.7, 1], ease: 'easeInOut' }}
          className='absolute inset-0 rounded-full'
          style={{
            background:
              'radial-gradient(closest-side, rgba(190,230,255,0.9), rgba(163,196,255,0.65) 45%, rgba(147,197,253,0.35) 60%, rgba(15,23,42,0) 70%)',
            filter: 'blur(8px)',
          }}
        />

        {/* Crystal shards (triangles) */}
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const dist = 12 + (i % 6) * 6;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          const rot = (i * 20) % 360;
          const delay = 0.15 + (i % 6) * 0.04;
          return (
            <motion.div
              key={`shard-${i}`}
              initial={{ opacity: 0, scale: 0.2, x: 0, y: 0, rotate: rot }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.2, 1, 1.1, 0.9],
                x: [0, x * 4, x * 8],
                y: [0, y * 4, y * 8],
                rotate: [rot, rot + 20, rot + 60],
              }}
              transition={{ duration: DURATION * 0.9, delay, ease: 'easeOut' }}
              className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            >
              <div
                className='w-4 h-6'
                style={{
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                  background:
                    'linear-gradient(180deg, rgba(191,219,254,0.95), rgba(199,210,254,0.9), rgba(226,232,240,0.2))',
                  boxShadow: '0 0 10px rgba(191,219,254,0.35)',
                }}
              />
            </motion.div>
          );
        })}

        {/* Light ribbons (cold aurora strips) */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`ribbon-${i}`}
            initial={{ x: '-120%', opacity: 0 }}
            animate={{ x: '120%', opacity: [0, 0.5, 0] }}
            transition={{ duration: DURATION * 0.7, delay: 0.2 + i * 0.15, ease: 'linear' }}
            className='absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px]'
            style={{
              background:
                'linear-gradient(90deg, rgba(199,210,254,0), rgba(199,210,254,0.8), rgba(199,210,254,0))',
              filter: 'blur(0.5px)',
            }}
          />
        ))}

        {/* Fine snow/dust particles */}
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={`flake-${i}`}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 180],
              y: [0, -60 - Math.random() * 120],
            }}
            transition={{
              duration: 1.2 + Math.random() * 1.1,
              delay: 0.15 + Math.random() * 0.6,
              ease: 'easeOut',
            }}
            className='absolute left-1/2 top-1/2 w-1 h-1 rounded-full'
            style={{
              background: 'rgba(226,232,240,0.85)',
              boxShadow: '0 0 6px rgba(191,219,254,0.6)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Caption */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: [0, 1, 0], y: [14, 0, -14] }}
          transition={{ duration: DURATION, times: [0, 0.4, 1] }}
          className='absolute -bottom-14 left-1/2 -translate-x-1/2 text-center'
        >
          <h3 className='text-xl font-bold text-indigo-200 mb-1'>◇ CRYSTALLIZING ◇</h3>
          <p className='text-slate-200 text-sm'>Your CrazyCube is turning into stardust...</p>
        </motion.div>
      </div>

      {/* Ambient cold glows */}
      <div className='absolute inset-0 pointer-events-none'>
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`glow-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.25, 0], scale: [0, 2.2, 3.2] }}
            transition={{ duration: DURATION, delay: Math.random() * 1.2, ease: 'easeOut' }}
            className='absolute w-64 h-64 rounded-full'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(closest-side, rgba(191,219,254,0.35), rgba(199,210,254,0.15), rgba(15,23,42,0))',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
