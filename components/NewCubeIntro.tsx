"use client";

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

type NewCubeIntroProps = {
  height?: number;
  /** Sources for the left side newcomers (defaults to mon1-4) */
  leftSrcs?: string[];
  /** Sources for the right side newcomers (defaults to mon1-4) */
  rightSrcs?: string[];
  /** Sources for centered old cubes (defaults to cube1-8) */
  oldSrcs?: string[];
};

// Default assets: side columns and old cubes use mon1-4
const monSet = ['/images/mon1.png', '/images/mon2.png', '/images/mon3.png', '/images/mon4.png'];
const cubeSet = ['/images/cube1.png', '/images/cube2.png', '/images/cube3.png', '/images/cube4.png', '/images/cube5.png', '/images/cube6.png', '/images/cube7.png', '/images/cube8.png'];
const defaultLeft = monSet;
const defaultRight = monSet;
const defaultOld = cubeSet;

export function NewCubeIntro({
  height = 560,
  leftSrcs = defaultLeft,
  rightSrcs = defaultRight,
  oldSrcs = defaultOld,
}: NewCubeIntroProps) {
  // Phases: idle(0-3s) -> arrive(newcomers move in, old scatter) -> settled(line + prompt) -> dance
  const [phase, setPhase] = React.useState<'intro' | 'confrontation' | 'takeover' | 'settled' | 'dance'>('intro');
  const [musicOn, setMusicOn] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    // Sequence of animation phases for a clearer story
    const timers = [
      setTimeout(() => setPhase('confrontation'), 2500), // Old cubes talk for 2.5s
      setTimeout(() => setPhase('takeover'), 4500),      // Confrontation lasts 2s
      setTimeout(() => setPhase('settled'), 5500),       // Takeover is quick, 1s
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const oldOuterVariants: Variants = {
    initial: { scale: 0.92, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
  } as const;

  // Old cubes shivering animation
  const shiverVariants: Variants = {
    shiver: {
      x: [0, -1.5, 1.5, -1.5, 1.5, 0],
      rotateY: [0, 4, -4, 4, -4, 0],
      rotateX: [0, -2, 2, -2, 2, 0],
      transition: { duration: 0.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
    },
    rest: { x: 0, rotateY: 0, rotateX: 0 },
  } as const;

  // Per-cube scatter targets for 5 old cubes
  const scatterTargets: Array<{ x: number; y: number; r?: number }> = [
    { x: -360, y: -80, r: -12 }, // far left-up
    { x: -140, y: 120, r: -6 },  // left-down
    { x: 40, y: -160, r: 0 },    // up
    { x: 180, y: 100, r: 8 },    // right-down
    { x: 360, y: -70, r: 14 },   // far right-up
  ];

  // Helpers to build N items by cycling sources
  const buildSources = (sources: string[], count: number): string[] =>
    Array.from({ length: count }, (_, i) => {
      const s = sources && sources.length > 0 ? sources[i % sources.length] : '/images/mon1.png';
      return s ?? '/images/mon1.png';
    });

  const leftCount = 6;
  const rightCount = 5;
  const leftImages = buildSources(leftSrcs, leftCount);
  const rightImages = buildSources(rightSrcs, rightCount);
  const oldCubeImages = buildSources(oldSrcs, 5);
  const oldDialogTopOffsets = ['-top-6', '-top-12', '-top-8', '-top-12', '-top-6'];

  const oldDialog: string[] = [
    'Почему синий стал фиолетовым?!',
    'Кто меня перекрасил?',
    'Это точно наш мир?',
    'Я был жёлтым, честно!',
    'Стоп, что происходит?'
  ];

  // Targets for newcomers line (centered horizontally)
  const newcomerCount = leftCount + rightCount; // 6
  const lineSpacing = 48; // px gap, reduced for 11 cubes
  const lineOffsets = Array.from({ length: newcomerCount }, (_, i) => (i - (newcomerCount - 1) / 2) * lineSpacing);

  return (
    <div className="relative w-full overflow-hidden" style={{ height, perspective: '1200px', transformStyle: 'preserve-3d' }}>
      {/* Stage panel with stronger contrast to avoid blending with page bg */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(35, 12, 58, 0.85) 0%, rgba(46, 16, 78, 0.8) 60%, rgba(35, 12, 58, 0.85) 100%)'
        }} />
        {/* Grid on the floor */}
        <div className="absolute inset-0" style={{
          backgroundSize: '40px 40px',
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          transform: 'translateY(60%) rotateX(75deg) scale(1.5)',
        }}/>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(60% 50% at 50% 55%, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.12) 45%, rgba(0,0,0,0) 70%)'
        }} />
        {/* Soft vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'
        }} />
      </div>
      {/* Floor ellipse (clearer shadow) */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 bottom-10 w-3/4 h-12 rounded-full"
        style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 70%)' }}
        animate={{ scale: [1, 1.02, 1], opacity: [1, 0.9, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

  {/* In-panel sign removed per request: no big inscription inside the panel. */}

      {/* Old cubes center cluster: 3s hold with dialogs, then scatter */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center gap-4 z-20"
        variants={oldOuterVariants}
        initial="initial"
        animate="show"
      >
        {oldCubeImages.map((src, i) => (
          <motion.div
            key={`old-${i}`}
            className="relative w-20 h-20 md:w-24 md:h-24"
            animate={
              phase === 'takeover'
                ? { // Scatter and fade out
                    x: scatterTargets[i]?.x ?? 0,
                    y: scatterTargets[i]?.y ?? 0,
                    rotate: scatterTargets[i]?.r ?? 0,
                    scale: 0.8,
                    opacity: 0,
                    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
                  }
                : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
            }
            // Hide them completely after takeover
            style={{ display: phase === 'settled' || phase === 'dance' ? 'none' : 'block' }}
          >
            <motion.div variants={shiverVariants} initial="rest" animate={phase === 'confrontation' ? 'shiver' : 'rest'}
              className="absolute inset-0 rounded-xl overflow-visible"
              style={{ filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.35))' }}
            >
              <Image src={src} alt={`old-cube-${i + 1}`} fill className="object-contain" />
            </motion.div>
            {/* Dialogs (show only in idle) */}
            {phase === 'intro' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.3 }}
                className={`absolute ${oldDialogTopOffsets[i % oldDialogTopOffsets.length]} left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-rose-200/90 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-rose-400/30 shadow-[0_0_18px_rgba(244,63,94,.25)] whitespace-nowrap`}
              >
                {oldDialog[i % oldDialog.length]}
              </motion.div>
            )}
          </motion.div>
        ))}
        {/* Label removed to avoid conflict with main page title */}
        {/*
        <motion.div
          className="absolute -top-10 md:-top-14 text-xs md:text-sm px-3 py-1 rounded-full border border-rose-400/30 bg-black/40 backdrop-blur-sm text-rose-100 shadow-[0_0_24px_rgba(244,63,94,.35)] select-none whitespace-nowrap"
          initial={{ opacity: 0, y: 6 }}
          animate={
            phase === 'intro' || phase === 'confrontation'
              ? { opacity: 1, y: 0 }
              : { // Explode on takeover
                  scale: [1, 1.25, 1.8],
                  opacity: [1, 0.9, 0],
                  letterSpacing: ['0em', '0.15em', '0.35em'],
                  filter: ['blur(0px)', 'blur(1px)', 'blur(6px)'],
                  transition: { duration: 0.45, ease: 'easeOut' }
                }
          }
        >
          СТАРЫЕ КУБЫ
        </motion.div>
        */}
      </motion.div>

      {/* Newcomers: spawn from sides (after 3s), move to center line; then wave dance if musicOn */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-end gap-4">
          {[...leftImages, ...rightImages].map((src, i) => {
            const fromLeft = i < leftCount;
            const initialX = fromLeft ? -360 - i * 40 : 360 + (newcomerCount - i - 1) * 40;
            const confrontationX = fromLeft ? -180 - i * 20 : 180 + (newcomerCount - i - 1) * 20;
            const targetX = lineOffsets[i] ?? 0;            
            const settleY = 110;

            const getInnerAnimation = () => {
              if (phase === 'dance') {
                return { 
                  y: [0, -15, 0, 12, 0], 
                  rotateY: [0, -10, 0, 10, 0],
                  rotateX: [0, 5, 0, -5, 0],
                  scale: [1, 1.05, 1, 1.05, 1]
                };
              }
              if (phase === 'settled') {
                return {
                  y: [0, -6, 0],
                  rotateY: [0, 3, -3, 0]
                };
              }
              return { y: 0, rotateY: 0, rotateX: 0, scale: 1 };
            };

            const getInnerTransition = () => {
              if (phase === 'dance') return { duration: 1.8 + i * 0.08, repeat: Infinity, ease: 'easeInOut' };
              if (phase === 'settled') return { duration: 4 + i * 0.2, repeat: Infinity, ease: 'easeInOut' };
              return { duration: 0.5 };
            };

            return (
              <motion.div
                key={`new-${i}`}
                className="relative w-16 h-16 md:w-20 md:h-20"
                initial={{ opacity: 0, x: initialX, y: fromLeft ? -40 : 40, scale: 0.9 }}
                animate={
                  phase === 'intro'
                    ? { opacity: 0 }
                    : phase === 'confrontation'
                    ? { opacity: 1, x: confrontationX, y: settleY, scale: 1, transition: { duration: 1.2, ease: 'easeOut' } }
                    : phase === 'takeover'
                    ? { opacity: 1, x: targetX, y: settleY, scale: 1, transition: { duration: 0.7, ease: 'easeIn' } }
                    : { opacity: 1, x: targetX, y: settleY }
                }
                style={{ filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.35))' }}
              >
                <motion.div
                  animate={getInnerAnimation()}
                  transition={getInnerTransition()}
                  className="absolute inset-0"
                >
                  <Image src={src} alt={`new-cube-${i + 1}`} fill className="object-contain" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
        {/* Newcomers Label removed to avoid conflict with main page title */}
        {/*
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%-160px)] text-xs md:text-sm px-3 py-1 rounded-full border border-cyan-300/30 bg-black/40 backdrop-blur-sm text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.35)] whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={phase === 'settled' || phase === 'dance' ? { opacity: 1, y: 0 } : { opacity: 0 }}
        >
          НОВЫЕ ГЕРОИ
        </motion.div>
        */}
      </div>

      {/* Music toggle control */}
      {(phase === 'settled' || phase === 'dance') && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5 } }}
        >
          <Button
            onClick={() => { setMusicOn(v => !v); setPhase(p => (p === 'settled' && !musicOn) ? 'dance' : 'settled'); }}
            variant="outline"
            className="px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,.25)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,.5)] hover:scale-105"
          >
            {musicOn ? `⏸ ${t('cubeAnimation.musicOn', 'Пауза')}` : `▶ ${t('cubeAnimation.musicOff', 'Включить музыку')}`}
          </Button>
        </motion.div>
      )}
      {/* Central octagon badge (subtle, visible from settled) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={(phase === 'settled' || phase === 'dance') ? { opacity: 1 } : { opacity: 0 }}
      >
        <div
          className="relative w-20 h-20 md:w-24 md:h-24"
          style={{
            clipPath: 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)',
            background: 'radial-gradient(60% 60% at 50% 50%, rgba(147,51,234,0.7), rgba(59,130,246,0.65))',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35), 0 0 30px rgba(168,85,247,0.35)'
          }}
        />
      </motion.div>

  {/* (Removed duplicate/older neon-sign blocks - unified top sign used instead) */}
    </div>
  );
}

export default NewCubeIntro;
