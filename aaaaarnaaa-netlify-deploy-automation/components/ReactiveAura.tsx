'use client';

import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

type Tint = 'pink' | 'fuchsia' | 'orange' | 'amber' | 'yellow' | 'cyan' | 'sky' | 'blue' | 'red' | 'emerald' | 'teal' | 'purple';

type ReactiveAuraProps = {
  tint?: Tint;
  intensity?: number; // 0.5..1.5
  className?: string;
};

/**
 * ReactiveAura renders an animated neon border/glow with sweeping light and electric flicker lines.
 * Designed to be placed inside a relative/overflow-hidden card container.
 */
export function ReactiveAura({ tint = 'cyan', intensity = 1, className = '' }: ReactiveAuraProps) {
  const colors = useMemo(() => getColors(tint, intensity), [tint, intensity]);

  return (
    <div className={`pointer-events-none absolute inset-0 z-0 ${className}`}>
      {/* Base radial glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${colors.glowA} 0%, ${colors.glowB} 35%, transparent 70%)`,
          boxShadow: `inset 0 0 30px ${colors.glowB}`,
        }}
        animate={{ opacity: [0.6, 0.9, 0.7, 0.95, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pulsing border ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          border: `1px solid ${colors.ringA}`,
          boxShadow: `0 0 12px ${colors.ringA}, 0 0 28px ${colors.ringB}, inset 0 0 18px ${colors.ringC}`,
        }}
        animate={{ opacity: [0.7, 1, 0.8, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Light sweep */}
      <motion.div
        className="absolute -inset-8 rounded-3xl"
        style={{
          background:
            `linear-gradient(90deg, transparent 0%, ${colors.sweep} 40%, ${colors.sweep} 60%, transparent 100%)`,
          filter: 'blur(8px)',
          rotate: '10deg',
        }}
        initial={{ x: '-60%' }}
        animate={{ x: ['-60%', '160%'] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Electric flicker lines */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`arc-${i}`}
          className="absolute h-[2px] rounded-full"
          style={{
            left: `${8 + Math.random() * 60}%`,
            top: `${10 + Math.random() * 70}%`,
            width: `${60 + Math.random() * 120}px`,
            background: `linear-gradient(90deg, transparent, ${colors.arc}, transparent)`,
            filter: 'drop-shadow(0 0 6px currentColor)',
            color: colors.arc,
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 2 + Math.random() * 2 }}
        />
      ))}
    </div>
  );
}

function getColors(tint: Tint, k: number) {
  // Base HSL presets per tint
  const map: Record<Tint, { h: number; s: number; l: number }> = {
    pink: { h: 330, s: 85, l: 60 },
    fuchsia: { h: 300, s: 90, l: 62 },
    orange: { h: 24, s: 95, l: 58 },
    amber: { h: 42, s: 95, l: 56 },
    yellow: { h: 50, s: 94, l: 58 },
    cyan: { h: 190, s: 90, l: 56 },
    sky: { h: 200, s: 88, l: 56 },
    blue: { h: 210, s: 92, l: 56 },
    red: { h: 0, s: 90, l: 54 },
    emerald: { h: 160, s: 80, l: 46 },
    teal: { h: 170, s: 85, l: 46 },
    purple: { h: 270, s: 85, l: 60 },
  };
  const { h, s, l } = map[tint] || map.cyan;
  const alpha = (a: number) => `hsla(${h}, ${s}%, ${Math.min(100, Math.max(0, l))}%, ${a})`;
  return {
    glowA: alpha(0.20 * k),
    glowB: alpha(0.30 * k),
    ringA: alpha(0.55 * k),
    ringB: alpha(0.35 * k),
    ringC: alpha(0.25 * k),
    sweep: alpha(0.18 * k),
    arc: alpha(0.95),
  };
}


