'use client';

import { useMemo } from 'react';

interface HeartRainProps {
  /** Amount of hearts per 100 vw (≈ screen width). Default = 6 */
  density?: number;
  /** Heart color (CSS). Default = #fb7185 (rose-500) */
  color?: string;
  /** Extra classes to pass to root wrapper */
  className?: string;
}

/**
 * Fixed layer that drops little 💕 SVGs from the top of the viewport.
 * Pure CSS/JS — no canvas, so almost free for the GPU; each heart is an absolutely-positioned
 * `<span>` with its own randomised `left`, `animation-delay`, `animation-duration` & `opacity`.
 */
export default function HeartRain({
  density = 6,
  color = '#fb7185',
  className = '',
}: HeartRainProps) {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pre-generate a list of hearts with random params; run only on first render (useMemo)
  const hearts = useMemo(() => {
    // For 1440 px width -> density hearts; scale with viewport width
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const isMobile = vw < 768;

    // Reduce density and speed on mobile
    const mobileDensity = Math.max(2, density * 0.4);
    const actualDensity = isMobile ? mobileDensity : density;
    const count = Math.max(6, Math.round((vw / 1440) * actualDensity));

    return Array.from({ length: count }, () => ({
      left: Math.random() * 100, // vw %
      size: isMobile ? 6 + Math.random() * 12 : 8 + Math.random() * 18, // smaller on mobile
      delay: Math.random() * (isMobile ? 12 : 8), // longer delays on mobile
      duration: (isMobile ? 12 : 8) + Math.random() * (isMobile ? 8 : 6), // slower on mobile
      opacity: isMobile ? 0.3 + Math.random() * 0.3 : 0.4 + Math.random() * 0.4, // less opacity on mobile
      sway: Math.random() > 0.5 ? 1 : -1, // direction of sway
    }));
  }, [density]);

  if (prefersReduced) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
    >
      {hearts.map((h, i) => (
        <span
          key={i}
          className='absolute animate-heart-fall'
          style={{
            left: `${h.left}%`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            opacity: h.opacity,
          }}
        >
          {/* minimalist inline SVG heart to avoid external images */}
          <svg
            width={h.size}
            height={h.size}
            viewBox='0 0 32 29'
            fill={color}
            xmlns='http://www.w3.org/2000/svg'
            style={{ display: 'block' }}
          >
            <path d='M23.6 0c3.9 0 7.1 3.1 7.1 7 0 7.4-13.3 16.9-15.7 18.5-.3.2-.7.2-1 0C11.6 23.9-1.7 14.4-1.7 7  -1.7 3.1 1.6 0 5.5 0 8 0 10.2 1.2 12 3.1 13.8 1.2 16 0 18.5 0' />
          </svg>
        </span>
      ))}

      {/* local CSS for fall + sway */}
      <style jsx>{`
        @keyframes heart-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
        .animate-heart-fall {
          top: -5vh;
          animation-name: heart-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
