'use client';

import { ChartCard } from './chart-card';
import { PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useCRAATokenStat } from '@/hooks/useCRATokenStat';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#facc15'] as const;

type Allocation = { name: string; value: number; color: string };

export function TokenAllocationDonut() {
  const { stat, loading } = useCRAATokenStat();

  const allocations: Allocation[] = stat
    ? [
        { name: 'Treasury', value: Number(stat.treasury), color: COLORS[0] },
        {
          name: 'DEX Liquidity',
          value: Number(stat.dexLiquidity),
          color: COLORS[1],
        },
        { name: 'Airdrop', value: Number(stat.airdrop), color: COLORS[2] },
        { name: 'Rewards', value: Number(stat.rewards), color: COLORS[3] },
      ]
    : [];

  const totalRaw = allocations.reduce((sum, a) => sum + a.value, 0);
  const data = allocations.map(a => ({
    ...a,
    pct: totalRaw ? (a.value / totalRaw) * 100 : 0,
  }));

  if (loading && !stat) {
    return (
      <ChartCard
        title='CRAA Token Allocation'
        icon={<PieChart className='h-5 w-5' />}
        color='cyan'
      >
        <Skeleton className='h-52 w-full' />
      </ChartCard>
    );
  }

  const total = 100;

  return (
    <ChartCard
      title='CRAA Token Allocation'
      icon={<PieChart className='h-5 w-5' />}
      color='cyan'
    >
      <div className='flex justify-center'>
        <div className='relative w-44 h-44'>
          <svg viewBox='0 0 100 100' className='w-full h-full rotate-[-90deg]'>
            {data.map((item, index) => {
              const percent = item.pct / 100;
              const offset = data
                .slice(0, index)
                .reduce((sum, d) => sum + d.pct / 100, 0);
              const dashArray = `${percent * 100} ${100 - percent * 100}`;
              return (
                <motion.circle
                  key={item.name}
                  cx='50'
                  cy='50'
                  r='40'
                  fill='transparent'
                  stroke={item.color}
                  strokeWidth='20'
                  strokeDasharray={dashArray}
                  strokeDashoffset={-offset * 100}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                />
              );
            })}
          </svg>
          {/* Center text */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-2xl font-bold text-slate-200'>CRAA</span>
            <span className='text-xs text-slate-400'>100%</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className='flex flex-col mt-4 space-y-2'>
        {data.map(item => (
          <div key={item.name} className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div
                className='w-3 h-3 rounded-sm mr-2'
                style={{ backgroundColor: item.color }}
              />
              <span className='text-sm text-slate-300'>{item.name}</span>
            </div>
            <div className='flex items-center'>
              <span className='text-sm font-medium text-slate-200 mr-2'>
                {item.pct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
