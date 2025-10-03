'use client';

import { useContractStats } from '@/hooks/useContractStats';
import { useUserNFTStats } from '@/hooks/useUserNFTStats';

import { StatsCard } from './stats-card';
import {
  Flame,
  Coins,
  BarChart3,
  Clock,
  Users,
  Lock,
  Sparkles,
  Vault,
  Activity,
  Zap,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatWithCommas } from '@/utils/formatNumber';

export function StatsGrid() {
  const { stats: contractStats, isLoading: isLoadingContract } =
    useContractStats();
  const { stats: userStats, isLoading: isLoadingUser } = useUserNFTStats();

  return (
    <div className='space-y-8'>
      {/* User Stats */}
      <div>
        <h2 className='text-xl font-bold text-slate-200 mb-4 flex items-center'>
          <Users className='mr-2 h-5 w-5 text-cyan-400' />
          Your Stats
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatsCard
              title='NFTs Owned'
              value={userStats.totalOwned}
              icon={<Sparkles className='h-4 w-4' />}
              color='cyan'
              loading={isLoadingUser}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatsCard
              title='Frozen NFTs'
              value={userStats.totalFrozen}
              icon={<Lock className='h-4 w-4' />}
              color='blue'
              loading={isLoadingUser}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <StatsCard
              title='Pending Rewards'
              value={userStats.totalRewards}
              description='CRAA tokens'
              icon={<Flame className='h-4 w-4' />}
              color='orange'
              loading={isLoadingUser}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <StatsCard
              title='Estimated Value'
              value={userStats.estimatedValue}
              description='CRAA tokens'
              icon={<Coins className='h-4 w-4' />}
              color='pink'
              loading={isLoadingUser}
            />
          </motion.div>
        </div>
      </div>

      {/* Contract Stats (real-time from CRAAzyCubeUltimate3_Safe) */}
      <div>
        <h2 className='text-xl font-bold text-slate-200 mb-4 flex items-center'>
          <BarChart3 className='mr-2 h-5 w-5 text-violet-400' />
          Contract Stats (Live)
          {contractStats?.isPaused && (
            <span className='ml-2 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30'>
              PAUSED
            </span>
          )}
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {/* Graveyard Size */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <StatsCard
              title='In Graveyard'
              value={contractStats?.graveyardSize ?? '0'}
              icon={<Lock className='h-4 w-4' />}
              color='red'
              loading={isLoadingContract}
            />
          </motion.div>

          {/* Total Stars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <StatsCard
              title='Total Stars'
              value='N/A'
              icon={<Sparkles className='h-4 w-4' />}
              color='yellow'
              loading={false}
            />
          </motion.div>

          {/* Monthly Pool */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <StatsCard
              title='Monthly Pool'
              value={parseFloat(
                contractStats?.currentMonthlyPool ?? '0'
              ).toFixed(0)}
              description='CRAA'
              icon={<Coins className='h-4 w-4' />}
              color='cyan'
              loading={isLoadingContract}
            />
          </motion.div>

          {/* Locked Pool */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <StatsCard
              title='Locked Pool'
              value={parseFloat(
                contractStats?.currentLockedPool ?? '0'
              ).toFixed(0)}
              description='CRAA'
              icon={<Vault className='h-4 w-4' />}
              color='purple'
              loading={isLoadingContract}
            />
          </motion.div>

          {/* Treasury */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <StatsCard
              title='Main Treasury'
              value={parseFloat(contractStats?.mainTreasury ?? '0').toFixed(0)}
              description='CRAA'
              icon={<Shield className='h-4 w-4' />}
              color='emerald'
              loading={isLoadingContract}
            />
          </motion.div>

          {/* Burned CRAA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          >
            <StatsCard
              title='Burned CRAA'
              value={parseFloat(contractStats?.totalCRAABurned ?? '0').toFixed(
                0
              )}
              description='Total'
              icon={<Flame className='h-4 w-4' />}
              color='orange'
              loading={isLoadingContract}
            />
          </motion.div>

          {/* Current Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.1 }}
          >
            <StatsCard
              title='Dynamic Rate'
              value={parseFloat(
                contractStats?.rewardRatePerSecond ?? '0'
              ).toFixed(0)}
              description='CRAA/sec'
              icon={<Activity className='h-4 w-4' />}
              color='blue'
              loading={isLoadingContract}
            />
          </motion.div>

          {/* Breed Cost */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.2 }}
          >
            <StatsCard
              title='Breed Cost'
              value={formatWithCommas(
                parseFloat(contractStats?.currentBreedCost ?? '0').toFixed(2)
              )}
              description='CRAA'
              icon={<Zap className='h-4 w-4' />}
              color='pink'
              loading={isLoadingContract}
            />
          </motion.div>
        </div>
      </div>

      {/* Configuration Stats */}
      <div>
        <h2 className='text-xl font-bold text-slate-200 mb-4 flex items-center'>
          <Clock className='mr-2 h-5 w-5 text-amber-400' />
          Game Configuration
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.3 }}
          >
            <StatsCard
              title='Ping Interval'
              value={
                contractStats
                  ? formatTime(parseInt(contractStats.pingInterval))
                  : 'Loading...'
              }
              icon={<Clock className='h-4 w-4' />}
              color='green'
              loading={isLoadingContract}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.4 }}
          >
            <StatsCard
              title='Breed Cooldown'
              value={
                contractStats
                  ? formatTime(parseInt(contractStats.breedCooldown))
                  : 'Loading...'
              }
              icon={<Sparkles className='h-4 w-4' />}
              color='purple'
              loading={isLoadingContract}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.5 }}
          >
            <StatsCard
              title='Graveyard Cooldown'
              value={
                contractStats
                  ? formatTime(parseInt(contractStats.graveyardCooldown))
                  : 'Loading...'
              }
              icon={<Lock className='h-4 w-4' />}
              color='red'
              loading={isLoadingContract}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.6 }}
          >
            <StatsCard
              title='Floor Price'
              value={parseFloat(contractStats?.manualFloorPrice ?? '0').toFixed(
                3
              )}
              description='APE'
              icon={<Coins className='h-4 w-4' />}
              color='amber'
              loading={isLoadingContract}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format seconds
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
