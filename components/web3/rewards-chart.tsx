'use client';

import { useState, useEffect } from 'react';
import { ChartCard } from './chart-card';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data for rewards chart
const mockRewardsData = [
  { date: '2025-01-01', amount: 10000 },
  { date: '2025-01-02', amount: 12000 },
  { date: '2025-01-03', amount: 9500 },
  { date: '2025-01-04', amount: 15000 },
  { date: '2025-01-05', amount: 18000 },
  { date: '2025-01-06', amount: 14000 },
  { date: '2025-01-07', amount: 20000 },
];

export function RewardsChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(mockRewardsData);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Find max and min values for scaling
  const maxValue = Math.max(...data.map(item => item.amount));
  const minValue = Math.min(...data.map(item => item.amount));

  // Create points for the line chart
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((item.amount - minValue) / (maxValue - minValue)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <ChartCard
      title='Rewards Distribution'
      icon={<TrendingUp className='h-5 w-5' />}
      color='green'
      loading={isLoading}
    >
      <div className='h-64 relative'>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <div
            key={`grid-${percent}`}
            className='absolute w-full border-t border-slate-700/30'
            style={{ top: `${percent}%` }}
          ></div>
        ))}

        {/* Chart line */}
        <svg
          className='absolute inset-0 w-full h-full'
          viewBox='0 0 100 100'
          preserveAspectRatio='none'
        >
          {/* Gradient fill under the line */}
          <defs>
            <linearGradient id='gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
              <stop offset='0%' stopColor='#10b981' stopOpacity='0.5' />
              <stop offset='100%' stopColor='#10b981' stopOpacity='0' />
            </linearGradient>
          </defs>

          {/* Area fill under the line */}
          <motion.path
            d={`M0,100 L${points} L100,100 Z`}
            fill='url(#gradient)'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Chart line */}
          <motion.polyline
            points={points}
            fill='none'
            stroke='#10b981'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Data points on chart */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y =
              100 - ((item.amount - minValue) / (maxValue - minValue)) * 100;
            return (
              <motion.circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r='1.5'
                fill='#10b981'
                stroke='#0f172a'
                strokeWidth='1'
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              />
            );
          })}
        </svg>

        {/* Value labels */}
        <div className='absolute right-0 inset-y-0 flex flex-col justify-between text-xs text-slate-400 pr-2'>
          <div>{formatNumber(maxValue)}</div>
          <div>{formatNumber((maxValue + minValue) / 2)}</div>
          <div>{formatNumber(minValue)}</div>
        </div>
      </div>

      {/* Date labels */}
      <div className='flex justify-between mt-2'>
        {data.map((item, index) => (
          <div key={`date-${index}`} className='text-xs text-slate-400'>
            {new Date(item.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// Helper to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
