'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Activity,
  DollarSign,
  Flame,
  Clock,
  Database,
  Vault,
  TrendingUp,
} from 'lucide-react';
import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { useGameStats } from '@/hooks/useGameStats';
import { formatEther } from 'viem';
import { formatWithCommas, formatSmart } from '@/utils/formatNumber';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: StatCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`border-${color}-500/30 bg-slate-900/50 backdrop-blur-sm hover:border-${color}-500/50 transition-colors`}
      >
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-slate-300'>
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-${color}-500/20`}>{icon}</div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold text-${color}-300`}>{value}</div>
          {subtitle && (
            <p className='text-xs text-slate-400 mt-1'>{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className='flex items-center mt-2'>
              <TrendingUp
                className={`w-3 h-3 mr-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}
              />
              <span
                className={`text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {trend >= 0 ? '+' : ''}
                {trend}% from last week
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const GameDashboard = () => {
  const { craaBalance, breedCost, isConnected } = useCrazyCubeGame();

  const { stats: gameStats, isLoading: statsLoading } = useGameStats();

  const { t } = useTranslation();

  // Memoize formatted breed cost to prevent infinite re-renders
  const formattedBreedCost = useMemo(() => {
    return formatSmart(breedCost || '0', 8);
  }, [breedCost]);

  const statCards = useMemo(
    () => [
      {
        title: 'Total NFTs',
        value: gameStats ? gameStats.totalNFTs.toLocaleString() : '-',
        subtitle: 'Max cube collection',
        icon: <Activity className='w-4 h-4 text-blue-400' />,
        color: 'blue' as const,
      },
      {
        title: 'Active NFTs',
        value: gameStats ? gameStats.activeCubes.toLocaleString() : '-',
        subtitle: 'Living crazy cubes',
        icon: <TrendingUp className='w-4 h-4 text-green-400' />,
        color: 'green' as const,
      },
      {
        title: 'In Graveyard',
        value: gameStats
          ? parseInt(gameStats.graveyardSize).toLocaleString()
          : '-',
        subtitle: 'Waiting for resurrection',
        icon: <Flame className='w-4 h-4 text-red-400' />,
        color: 'red' as const,
      },
      {
        title: 'Reward Pool',
        value: gameStats
          ? `${new Intl.NumberFormat('en-US').format(parseFloat(gameStats.currentMonthlyPool))} CRAA`
          : '-',
        subtitle: 'Locked for rewards',
        icon: <Vault className='w-4 h-4 text-purple-400' />,
        color: 'purple' as const,
      },
      {
        title: 'CRAA Supply',
        value: gameStats
          ? `${new Intl.NumberFormat('en-US').format(parseFloat(gameStats.craaTotalSupply))} CRAA`
          : '-',
        subtitle: 'Total CRAA minted',
        icon: <Database className='w-4 h-4 text-amber-400' />,
        color: 'amber' as const,
      },
      {
        title: 'Breed Cost',
        value: `${formattedBreedCost} CRAA`,
        subtitle: 'Current breeding fee',
        icon: <DollarSign className='w-4 h-4 text-pink-400' />,
        color: 'pink' as const,
      },
    ],
    [gameStats, formattedBreedCost]
  );

  if (!isConnected) {
    return (
      <div className='text-center py-12'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-slate-900/50 backdrop-blur-sm border border-slate-500/30 rounded-lg p-8 max-w-md mx-auto'
        >
          <div className='text-6xl mb-4'>🔗</div>
          <h3 className='text-xl font-semibold text-slate-300 mb-2'>
            Connect Your Wallet
          </h3>
          <p className='text-slate-400'>
            Connect your wallet to view game statistics and your personal data.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2'>
          Game Statistics
        </h2>
        <p className='text-slate-400'>
          Current state of the CrazyCube Ultimate game
        </p>
      </div>

      {/* Personal stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-slate-500/30 rounded-lg p-4'
      >
        <div className='flex flex-wrap justify-center gap-6 text-center'>
          <div>
            <div className='text-lg font-bold text-cyan-300'>
              {parseFloat(craaBalance).toFixed(2)} CRAA
            </div>
            <div className='text-xs text-slate-400'>Your Balance</div>
          </div>
          <div>
            <div className='text-lg font-bold text-green-300'>
              {t('wallet.connected', 'Connected')}
            </div>
            <div className='text-xs text-slate-400'>Wallet Status</div>
          </div>
          <div>
            <div className='text-lg font-bold text-purple-300'>Active</div>
            <div className='text-xs text-slate-400'>Game Status</div>
          </div>
        </div>
      </motion.div>

      {/* Main stats grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className='border-slate-500/30 bg-slate-900/50 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-slate-300 flex items-center gap-2'>
              <Activity className='w-5 h-5 text-cyan-400' />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[
                {
                  action: 'NFT Burned',
                  details: 'Token #1543 → 12h wait',
                  time: '2 min ago',
                  type: 'burn',
                },
                {
                  action: 'Breeding Success',
                  details: 'Token #720 + #947 → New NFT',
                  time: '15 min ago',
                  type: 'breed',
                },
                {
                  action: 'Rewards Claimed',
                  details: '150.5 CRAA claimed',
                  time: '1h ago',
                  type: 'claim',
                },
                {
                  action: 'NFT Pinged',
                  details: 'Token #1346 earned CRAA',
                  time: '2h ago',
                  type: 'ping',
                },
              ].map((activity, index) => (
                <motion.div
                  key={activity.action}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className='flex items-center justify-between py-2 border-b border-slate-700/50 last:border-b-0'
                >
                  <div className='flex items-center gap-3'>
                    <Badge
                      className={`
                        ${activity.type === 'burn' ? 'bg-red-500/20 text-red-300' : ''}
                        ${activity.type === 'breed' ? 'bg-pink-500/20 text-pink-300' : ''}
                        ${activity.type === 'claim' ? 'bg-green-500/20 text-green-300' : ''}
                        ${activity.type === 'ping' ? 'bg-blue-500/20 text-blue-300' : ''}
                      `}
                    >
                      {activity.action}
                    </Badge>
                    <div>
                      <div className='text-sm text-slate-300'>
                        {activity.details}
                      </div>
                    </div>
                  </div>
                  <div className='text-xs text-slate-400'>{activity.time}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Game Rules Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className='border-slate-500/30 bg-slate-900/50 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-slate-300'>
              Game Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <h4 className='font-semibold text-orange-300 mb-2'>
                  🏃 Ping System
                </h4>
                <ul className='text-slate-400 space-y-1'>
                  <li>• Accumulate CRAA every 3 minutes</li>
                  <li>• Reward depends on NFT rarity</li>
                  <li>• Must be activated to ping</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold text-red-300 mb-2'>
                  🔥 Burn System
                </h4>
                <ul className='text-slate-400 space-y-1'>
                  <li>• Burn NFT for CRAA rewards</li>
                  <li>• 5% fee from locked CRAA</li>
                  <li>• Choose 12h/24h/48h wait times</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold text-pink-300 mb-2'>
                  💕 Breeding System
                </h4>
                <ul className='text-slate-400 space-y-1'>
                  <li>• Combine 2 NFTs, lose 1 star each</li>
                  <li>• Cost: {formattedBreedCost} CRAA</li>
                  <li>• Resurrects NFT from graveyard</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold text-green-300 mb-2'>
                  💰 Reward System
                </h4>
                <ul className='text-slate-400 space-y-1'>
                  <li>• 12h: 50% player reward</li>
                  <li>• 24h: 60% player reward</li>
                  <li>• 48h: 70% player reward</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
