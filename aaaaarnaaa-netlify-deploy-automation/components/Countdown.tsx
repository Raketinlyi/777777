'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface CountdownProps {
  targetTimestamp: bigint;
  onComplete: () => void;
}

export const Countdown = ({ targetTimestamp, onComplete }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const target = BigInt(targetTimestamp);
    return target > now ? Number(target - now) : 0;
  });

  const { t } = useTranslation();

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 3));
    }, 3000); // Changed from 1000 to 3000 (3 seconds)

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return t('status.done', 'Done!');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className='text-center font-mono text-lg tabular-nums text-amber-300'>
      {formatDuration(timeLeft)}
    </div>
  );
};
