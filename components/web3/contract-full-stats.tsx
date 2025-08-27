'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStats } from '@/hooks/useGameStats';
import { motion } from 'framer-motion';
import {
  Flame,
  Coins,
  DollarSign,
  TrendingUp,
  Zap,
  Activity,
  Users,
  Clock,
  Target,
  BarChart3,
  Sparkles,
  Shield,
  Vault,
} from 'lucide-react';
import { formatWithCommas } from '@/utils/formatNumber';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-${color}-500/30 hover:border-${color}-400/50 transition-all duration-300`}
    >
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-slate-400 text-sm'>{title}</p>
            <p className={`text-${color}-400 text-lg font-bold`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 text-${color}-400`} />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export function ContractFullStats() {
  const {
    stats: contractStats,
    isLoading,
    error,
    pingIntervalFormatted,
    breedCooldownFormatted,
    graveyardCooldownFormatted,
    burnFeeFormatted,
    monthlyUnlockFormatted,
  } = useGameStats();

  if (isLoading) {
    return (
      <Card className='bg-slate-800/50 border-slate-700/50'>
        <CardHeader>
          <CardTitle className='text-slate-200'>
            Loading Contract Stats...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className='h-24 bg-slate-700/30 rounded-lg animate-pulse'
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-red-800/20 border-red-500/30'>
        <CardHeader>
          <CardTitle className='text-red-400'>Error Loading Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-red-300'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!contractStats) {
    return (
      <Card className='bg-slate-800/50 border-slate-700/50'>
        <CardHeader>
          <CardTitle className='text-slate-200'>No Data Available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Core contract data
  const coreStats = [
    {
      title: 'Total CRAA Burned',
      value: `${parseFloat(contractStats.totalCRAABurned).toFixed(0)} CRAA`,
      icon: Flame,
      color: 'orange',
    },
    {
      title: 'Total NFTs Burned',
      value: contractStats.totalTokensBurned,
      icon: Activity,
      color: 'red',
    },
    {
      title: 'Active NFTs',
      value: contractStats.activeCubes.toString(),
      icon: Users,
      color: 'green',
    },
    { title: 'Total Stars', value: 'N/A', icon: Sparkles, color: 'yellow' },
    {
      title: 'Graveyard Size',
      value: contractStats.graveyardSize,
      icon: Users,
      color: 'slate',
    },
  ];

  // Pool stats
  const poolStats = [
    {
      title: 'Monthly Reward Pool',
      value: `${parseFloat(contractStats.currentMonthlyPool).toFixed(0)} CRAA`,
      icon: Coins,
      color: 'cyan',
    },
    {
      title: 'Locked Rewards Pool',
      value: `${parseFloat(contractStats.currentLockedPool).toFixed(0)} CRAA`,
      icon: Vault,
      color: 'purple',
    },
    {
      title: 'Main Treasury',
      value: `${parseFloat(contractStats.mainTreasury).toFixed(0)} CRAA`,
      icon: Shield,
      color: 'emerald',
    },
  ];

  // Configuration stats
  const configStats = [
    {
      title: 'Current Breed Cost',
      value: `${formatWithCommas(parseFloat(contractStats.currentBreedCost).toFixed(2))} CRAA`,
      icon: Coins,
      color: 'pink',
    },
    {
      title: 'Ping Interval',
      value: pingIntervalFormatted,
      icon: Clock,
      color: 'blue',
    },
    {
      title: 'Manual Floor Price',
      value: `${parseFloat(contractStats.manualFloorPrice).toFixed(4)} APE`,
      icon: DollarSign,
      color: 'amber',
    },
    {
      title: 'Reward Rate/Second',
      value: `${parseFloat(contractStats.rewardRatePerSecond).toFixed(6)} CRAA`,
      icon: Zap,
      color: 'green',
    },
    {
      title: 'Breed Cooldown',
      value: breedCooldownFormatted,
      icon: Target,
      color: 'indigo',
    },
    {
      title: 'Graveyard Cooldown',
      value: graveyardCooldownFormatted,
      icon: Clock,
      color: 'rose',
    },
    {
      title: 'Burn Fee',
      value: burnFeeFormatted,
      icon: Flame,
      color: 'orange',
    },
    {
      title: 'Monthly Unlock',
      value: monthlyUnlockFormatted,
      icon: TrendingUp,
      color: 'teal',
    },
    {
      title: 'Dynamic Rate',
      value: `${parseFloat(contractStats.rewardRatePerSecond).toFixed(0)} CRAA/sec`,
      icon: Activity,
      color: 'blue',
    },
  ];

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-slate-200 flex items-center'>
          <BarChart3 className='mr-3 h-6 w-6 text-violet-400' />
          Contract Statistics (Live)
        </h2>
        {contractStats.isPaused && (
          <span className='px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-full border border-red-500/30'>
            CONTRACT PAUSED
          </span>
        )}
      </div>

      {/* Core Statistics */}
      <section>
        <h3 className='text-lg font-semibold text-slate-300 mb-4 flex items-center'>
          <Activity className='mr-2 h-5 w-5 text-orange-400' />
          Core Statistics
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {coreStats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index * 0.1} />
          ))}
        </div>
      </section>

      {/* Pool Information */}
      <section>
        <h3 className='text-lg font-semibold text-slate-300 mb-4 flex items-center'>
          <Vault className='mr-2 h-5 w-5 text-cyan-400' />
          Pool Information
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {poolStats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={0.4 + index * 0.1} />
          ))}
        </div>
      </section>

      {/* Game Configuration */}
      <section>
        <h3 className='text-lg font-semibold text-slate-300 mb-4 flex items-center'>
          <Target className='mr-2 h-5 w-5 text-purple-400' />
          Game Configuration
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {configStats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={0.7 + index * 0.1} />
          ))}
        </div>
      </section>

      {/* Data Source Info */}
      <div className='text-center mt-8'>
        <p className='text-slate-400 text-sm'>
          Data retrieved directly from CrazyCubeUltimate3_Safe contract on
          ApeChain. Last updated:{' '}
          {new Date(contractStats.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
