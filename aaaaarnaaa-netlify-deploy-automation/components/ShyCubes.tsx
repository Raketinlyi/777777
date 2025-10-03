'use client';

// COMPLETELY REWRITTEN COMPONENT

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Five cube images saved under /public/img/cubes/d1.png .. d5.png
const CUBE_IMAGES = [
  '/images/d1.png',
  '/images/d2.png',
  '/images/d3.png',
  '/images/d4.png',
  '/images/d5.png',
] as const;

type Props = {
  /** active when at least 1 NFT selected for breeding */
  active: boolean;
};

interface CubeState {
  shown: boolean;
  delay?: number;
}

export const ShyCubes = ({ active }: Props) => {
  const { t } = useTranslation();
  const BUBBLES = [
    'Oh-oh-oh!',
    "What's going on here?",
    "Who's making noise?",
    "We didn't see anything!",
    "Don't look!",
  ];
  // Internal state for each cube
  const [cubes, setCubes] = useState<CubeState[]>(() =>
    Array.from({ length: 5 }, () => ({ shown: false, delay: 0 }))
  );
  const [bubbleIdx, setBubbleIdx] = useState<number | null>(null);

  const patterns = useMemo<number[][]>(() => {
    return [
      [0], // one cube instantly
      [0, 0, 0, 0, 0], // all at once
      [0, 200, 400, 600, 800], // wave
      [0, 500], // two
      [0, 0, 700], // three groups
      [0, 400, 400, 400, 400], // one first then others together
    ];
  }, []);

  // pick random pattern whenever active switches true
  useEffect(() => {
    if (!active) {
      // hide all cubes when not active
      setCubes(prev => prev.map(() => ({ shown: false, delay: 0 })));
      setBubbleIdx(null);
      return;
    }
    // choose pattern
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    if (!pattern) return; // Safety check
    const newStates: CubeState[] = cubes.map((_, i) => ({
      shown: false,
      delay: pattern[i] ?? pattern[pattern.length - 1] ?? 0,
    }));
    setCubes(newStates);

    // reveal cubes according to delay
    newStates.forEach((c, idx) => {
      setTimeout(() => {
        setCubes(prev => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], shown: true };
          return copy;
        });
        // show bubble near first appearing cube
        if (idx === 0) {
          setBubbleIdx(idx);
        }
      }, c.delay || 0);
    });
  }, [active]);

  const variants = {
    hidden: {
      x: '-180px',
      opacity: 0,
    },
    peek: {
      x: 'calc(100vw + 180px)',
      opacity: 1,
      transition: { duration: 30, ease: 'linear' },
    },
  } as const;

  // don't render when not active and all hidden
  const anyShown = cubes.some(c => c.shown);

  return (
    <div className='pointer-events-none fixed bottom-0 left-0 flex gap-12 z-50 select-none'>
      {CUBE_IMAGES.map((src, idx) => (
        <motion.div
          key={idx}
          variants={variants}
          initial='hidden'
          animate={cubes[idx]?.shown ? 'peek' : 'hidden'}
        >
          <img src={src} alt='shy cube' className='w-60 h-60' />
          {bubbleIdx === idx && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className='text-xs bg-slate-800/80 text-white px-2 py-1 rounded shadow-md mt-1'
            >
              {BUBBLES.length > 0
                ? BUBBLES[Math.floor(Math.random() * BUBBLES.length)]
                : "Don't look!"}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};
