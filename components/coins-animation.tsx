'use client';

import { useMemo } from 'react';
import Image from 'next/image';

interface CoinsAnimationProps {
  /** Amount of coins per 100 vw (≈ screen width). Default = 12 */
  density?: number;
  /** Extra classes to pass to root wrapper */
  className?: string;
  /** Base intensity multiplier. 1 = default. Increase for more coins. */
  intensity?: number;
  /** Coin color: gold (default) or blue */
  theme?: 'gold' | 'blue';
}

/**
 * Fixed layer that drops coin-blue.png from top of screen.
 * Pure CSS/JS — each coin is a <span> with random left, delay, duration, opacity, size.
 */
export function CoinsAnimation({
  density = 12,
  className = '',
  intensity,
  theme = 'gold',
}: CoinsAnimationProps) {
      // If intensity is passed, use it for density (for backward compatibility)
  const effectiveDensity =
    intensity !== undefined ? density * intensity : density;

      // Pre-generate list of coins with random parameters (useMemo)
  const coins = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const isMobile = vw < 768;
    const mobileDensity = Math.max(4, effectiveDensity * 0.5);
    const actualDensity = isMobile ? mobileDensity : effectiveDensity;
    const count = Math.max(8, Math.round((vw / 1440) * actualDensity));
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100, // vw %
      size: isMobile ? 18 + Math.random() * 18 : 24 + Math.random() * 28,
      delay: Math.random() * (isMobile ? 8 : 5),
      duration: (isMobile ? 7 : 5) + Math.random() * (isMobile ? 5 : 3),
      opacity: isMobile ? 0.3 + Math.random() * 0.3 : 0.4 + Math.random() * 0.4,
    }));
  }, [effectiveDensity]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
    >
      {coins.map((c, i) => (
        <span
          key={i}
          className='absolute animate-coin-fall'
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            opacity: c.opacity,
            top: '-8vh',
          }}
        >
          <Image
            src={
              theme === 'blue'
                ? '/images/coin-blue.png'
                : '/images/coin-gold.png'
            }
            width={c.size}
            height={c.size}
            style={{ display: 'block', width: c.size, height: c.size }}
            alt='coin'
            draggable={false}
            onError={e => {
              // Fallback to blue coin if gold fails to load
              if (theme === 'gold') {
                e.currentTarget.src = '/images/coin-blue.png';
              }
            }}
          />
        </span>
      ))}
      <style jsx>{`
        @keyframes coin-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
        .animate-coin-fall {
          top: -5vh;
          animation-name: coin-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

export default CoinsAnimation;
