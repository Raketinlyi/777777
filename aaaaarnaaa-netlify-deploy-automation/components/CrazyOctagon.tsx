'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type CrazyOctagonProps = {
  /** When true, renders only the octagon shape (no title/subtitle). */
  iconOnly?: boolean;
  className?: string;
};

export function CrazyOctagon({ iconOnly, className }: CrazyOctagonProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative flex items-center justify-center w-auto h-auto select-none group ${className ?? ''}`}>
      {/* Octagon SVG as background */}
      <svg
        viewBox="0 0 120 120"
        className="absolute w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 drop-shadow-[0_0_10px_rgba(192,132,252,0.35)] -z-10"
      >
        <defs>
          <filter id="octagon-glow-header" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          </filter>
        </defs>
        <polygon
          points="42,8 78,8 112,42 112,78 78,112 42,112 8,78 8,42"
          fill="rgba(20, 9, 36, 0.45)"
          stroke="#a855f7"
          strokeWidth="0.8"
          style={{ filter: 'url(#octagon-glow-header)' }}
          className="transition-all duration-300 group-hover:stroke-fuchsia-400"
        />
        <polygon
          points="42,8 78,8 112,42 112,78 78,112 42,112 8,78 8,42"
          fill="transparent"
          stroke="#f0abfc"
          strokeWidth="0.6"
          className="opacity-40 transition-all duration-300 group-hover:opacity-100"
        />
      </svg>

      {/* Text Content (optional) */}
      {!iconOnly && (
        <div className="relative z-10 text-center">
          <h1
            className={
              'mx-auto uppercase font-extrabold tracking-[0.2em] ' +
              'text-3xl md:text-5xl lg:text-6xl text-fuchsia-300 transition-colors duration-300 group-hover:text-white'
            }
            style={{
              textShadow:
                '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #e879f9, 0 0 35px #e879f9',
            }}
          >
            {t('home.title', 'CrazyOctagon')}
          </h1>
          <p className="mt-1 text-[10px] md:text-sm text-purple-300 transition-colors duration-300 group-hover:text-purple-200">
            {t('home.subtitle', 'Where octagons cry and joke!')}
          </p>
        </div>
      )}

      {/* Large CrazyOctagon text when iconOnly is true (for header) */}
      {iconOnly && (
        <div className="relative z-50 text-center px-2 py-1">
          <h1
            className="mx-auto font-black tracking-[0.05em]"
            style={{
              fontSize: 'clamp(25.9px, 5.62vw, 51.8px)',
              lineHeight: 1,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #b45309, #fbbf24)',
              backgroundSize: '320% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(251,191,36,0.95), 0 0 40px rgba(245,158,11,0.85), 0 0 60px rgba(217,119,6,0.7), 0 0 85px rgba(180,83,9,0.5)',
            }}
          >
            CrazyOctagon
          </h1>
        </div>
      )}
    </div>
  );
}