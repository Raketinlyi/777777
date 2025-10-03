'use client';

import { useState } from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChartCard } from './chart-card';
import { useBurnReviveStats } from '@/hooks/useBurnReviveStats';

export function BurnReviveChart() {
  const { stats, loading } = useBurnReviveStats();
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');

  if (!stats)
    return (
      <ChartCard
        title='Burn / Revive'
        icon={<Flame className='h-5 w-5' />}
        color='orange'
        loading
      >
        <div />
      </ChartCard>
    );

  const series =
    range === '24h'
      ? stats.last24h
      : range === '7d'
        ? stats.last7d
        : stats.last30d;
  const max = Math.max(...series.map(p => p.burn + p.revive), 1);

  return (
    <ChartCard
      title='Burn / Revive'
      icon={<Flame className='h-5 w-5' />}
      color='orange'
      loading={loading}
    >
      {/* Tabs */}
      <div className='flex space-x-2 mb-2 text-xs'>
        {['24h', '7d', '30d'].map(r => (
          <button
            key={r}
            onClick={() => setRange(r as '24h' | '7d' | '30d')}
            className={`px-3 py-1 rounded-md ${range === r ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className='h-64 flex items-end space-x-1'>
        {series.map((p, i) => (
          <div
            key={p.date}
            className='flex-1 flex flex-col items-center justify-end'
          >
            {/* revive (green) */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(p.revive / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className='w-full bg-green-500/70'
            >
              <div className='h-full w-full bg-gradient-to-t from-green-600/80 to-green-400/80' />
            </motion.div>
            {/* burn (orange)*/}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(p.burn / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
              className='w-full bg-orange-500/70'
            >
              <div className='h-full w-full bg-gradient-to-t from-orange-600/80 to-orange-400/80' />
            </motion.div>
            <div className='text-[10px] mt-1 text-slate-400 rotate-90 md:rotate-0 md:text-xs whitespace-nowrap'>
              {p.date.slice(5)}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className='flex justify-center mt-3 space-x-4 text-xs text-slate-300'>
        <div className='flex items-center'>
          <span className='w-3 h-3 bg-orange-500 mr-1'></span>Burn
        </div>
        <div className='flex items-center'>
          <span className='w-3 h-3 bg-green-500 mr-1'></span>Revive
        </div>
      </div>
    </ChartCard>
  );
}
