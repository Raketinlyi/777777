'use client';

import { useEffect, useState } from 'react';

interface CooldownBadgeProps {
  /** seconds remaining */
  secondsLeft: number;
  /** full cooldown seconds, default 48h */
  fullSeconds?: number;
  /** optional className for wrapper */
  className?: string;
}

/**
 * Displays a small circular progress bar with remaining time (Hh Mm) inside.
 * Used on NFT card to indicate breeding cooldown.
 */
export default function CooldownBadge({
  secondsLeft: initialSeconds,
  fullSeconds = 48 * 60 * 60,
  className = '',
}: CooldownBadgeProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    if (initialSeconds <= 0) return;
    setSecondsLeft(initialSeconds);
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 3) {
          clearInterval(id);
          return Math.max(0, s - 3);
        }
        return s - 3;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [initialSeconds]);

  if (secondsLeft <= 0) return null;

  const pct = Math.max(0, Math.min(100, (1 - secondsLeft / fullSeconds) * 100));
  const radius = 18;
  const stroke = 3;
  const norm = radius - stroke / 2;
  const circumference = 2 * Math.PI * norm;
  const dashOffset = circumference - (pct / 100) * circumference;

  const hrs = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);

  return (
    <div
      className={`w-12 h-12 absolute top-2 right-2 flex items-center justify-center ${className}`}
      title={`${hrs}h ${mins}m left`}
    >
      <svg width={radius * 2} height={radius * 2} className='rotate-[-90deg]'>
        <circle
          cx={radius}
          cy={radius}
          r={norm}
          stroke='#4b5563' /* slate-600 */
          strokeWidth={stroke}
          fill='transparent'
          opacity={0.4}
        />
        <circle
          cx={radius}
          cy={radius}
          r={norm}
          stroke='#fbbf24' /* yellow-400 */
          strokeWidth={stroke}
          fill='transparent'
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap='round'
        />
      </svg>
      <span className='absolute text-[10px] font-medium text-white leading-none'>
        {hrs}h
        <br />
        {mins}m
      </span>
    </div>
  );
}
