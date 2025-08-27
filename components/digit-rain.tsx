'use client';

import { useEffect, useState } from 'react';

interface DigitRainProps {
  /** Amount of digits per 100 vw (≈ screen width). Default = 12 */
  density?: number;
  /** Array of colors for digits; will pick random. Default: lime / cyan / yellow */
  colors?: string[];
  /** Extra className */
  className?: string;
  /** Font size range in px (min, max) */
  sizeRange?: [number, number];
}

/**
 * Animated rain of random digits (0-9) dropping from top to bottom — similar to Matrix effect.
 * Pure DOM/CSS (no canvas). Each digit is absolutely positioned with its own offset & animation params.
 */
export default function DigitRain({
  density = 12,
  colors = ['#bef264', '#67e8f9', '#facc15'],
  className = '',
  sizeRange = [10, 24],
}: DigitRainProps) {
  // Store the generated digits in state so the first render (SSR + hydration) is deterministic (empty array)
  const [digits, setDigits] = useState<
    Array<{
      left: number;
      size: number;
      delay: number;
      duration: number;
      opacity: number;
      color: string;
      char: string;
      rotate: number;
    }>
  >([]);

  // Respect user reduced-motion setting
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Generate digits only after the component is mounted on the client to avoid SSR ↔ hydration mismatch
  useEffect(() => {
    const vw = window.innerWidth;
    const count = Math.max(8, Math.round((vw / 1440) * density));
    const generated = Array.from({ length: count }, () => ({
      left: Math.random() * 100, // percentage
      size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 6,
      opacity: 0.4 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      char: String(Math.floor(Math.random() * 10)),
      rotate: (Math.random() - 0.5) * 40, // -20..20 deg
    }));
    setDigits(generated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Respect user reduced-motion setting
  if (prefersReducedMotion) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
    >
      {digits.map((d, i) => (
        <span
          key={i}
          className='absolute animate-digit-fall font-mono select-none'
          style={{
            left: `${d.left}%`,
            fontSize: `${d.size}px`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            opacity: d.opacity,
            color: d.color,
            transform: `rotate(${d.rotate}deg)`,
          }}
        >
          {d.char}
        </span>
      ))}

      <style jsx>{`
        @keyframes digit-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
        .animate-digit-fall {
          top: -5vh;
          animation-name: digit-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
