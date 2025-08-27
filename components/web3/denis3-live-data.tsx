'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Activity,
  Users,
  Coins,
  TrendingUp,
  Clock,
  Zap,
  Flame,
  Heart,
  Shield,
  Vault,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameStats } from '@/hooks/useGameStats';
import { formatWithCommas } from '@/utils/formatNumber';

export default function Denis3LiveData() {
  const { stats: contractStats, isLoading, error } = useGameStats();

  const formatCRAA = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  const totalStarsValue = 'N/A'; // totalStars was deprecated due to invalid data

  if (isLoading) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400'></div>
          <span className='ml-3 text-slate-300'>
            Loading live contract data...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='text-center text-red-400'>
          <Database className='h-12 w-12 mx-auto mb-4' />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!contractStats) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-blue-500/30'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center'>
              <Database className='h-6 w-6 mr-2 text-blue-400' />
              Live Contract Data
            </h2>
            <p className='text-blue-300 mt-1'>
              Live data fetched directly from the contract
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='h-2 w-2 bg-green-400 rounded-full animate-pulse'></div>
            <div className='text-right'>
              <p className='text-green-400 text-sm'>Live</p>
              <p className='text-slate-400 text-xs'>
                {formatTime(contractStats.lastUpdated)}
              </p>
            </div>
            {contractStats.isPaused && (
              <Badge variant='destructive' className='ml-2'>
                PAUSED
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList className='bg-slate-800/50 p-1'>
          <TabsTrigger
            value='overview'
            className='data-[state=active]:bg-blue-600'
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value='pools'
            className='data-[state=active]:bg-purple-600'
          >
            Pools
          </TabsTrigger>
          <TabsTrigger
            value='config'
            className='data-[state=active]:bg-orange-600'
          >
            Config
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Core Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className='p-6 bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Flame className='h-8 w-8 text-orange-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        CRAA Burned
                      </h3>
                      <p className='text-orange-300 text-sm'>Total destroyed</p>
                    </div>
                  </div>
                </div>
                <div className='text-3xl font-bold text-orange-400'>
                  {formatCRAA(contractStats.totalCRAABurned)} CRAA
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className='p-6 bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Users className='h-8 w-8 text-red-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Graveyard
                      </h3>
                      <p className='text-red-300 text-sm'>NFTs burned</p>
                    </div>
                  </div>
                </div>
                <div className='text-3xl font-bold text-red-400'>
                  {contractStats.graveyardSize}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className='p-6 bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Sparkles className='h-8 w-8 text-yellow-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Total Stars
                      </h3>
                      <p className='text-yellow-300 text-sm'>
                        Function disabled
                      </p>
                    </div>
                  </div>
                </div>
                <div className='mt-4 text-3xl font-mono text-yellow-200'>
                  N/A
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className='p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Users className='h-8 w-8 text-green-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Active NFTs
                      </h3>
                      <p className='text-green-300 text-sm'>Live NFTs</p>
                    </div>
                  </div>
                </div>
                <div className='text-3xl font-bold text-green-400'>
                  {contractStats.activeCubes}
                </div>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Pools Tab */}
        <TabsContent value='pools'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className='p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Coins className='h-8 w-8 text-cyan-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Monthly Pool
                      </h3>
                      <p className='text-cyan-300 text-sm'>Active rewards</p>
                    </div>
                  </div>
                </div>
                <div className='text-2xl font-bold text-cyan-400'>
                  {formatCRAA(contractStats.currentMonthlyPool)} CRAA
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className='p-6 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Vault className='h-8 w-8 text-purple-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Locked Pool
                      </h3>
                      <p className='text-purple-300 text-sm'>Reserved funds</p>
                    </div>
                  </div>
                </div>
                <div className='text-2xl font-bold text-purple-400'>
                  {formatCRAA(contractStats.currentLockedPool)} CRAA
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className='p-6 bg-gradient-to-br from-emerald-900/20 to-green-900/20 border-emerald-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Shield className='h-8 w-8 text-emerald-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Main Treasury
                      </h3>
                      <p className='text-emerald-300 text-sm'>
                        Contract balance
                      </p>
                    </div>
                  </div>
                </div>
                <div className='text-2xl font-bold text-emerald-400'>
                  {formatCRAA(contractStats.mainTreasury)} CRAA
                </div>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value='config'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className='p-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Clock className='h-8 w-8 text-blue-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Ping Interval
                      </h3>
                      <p className='text-blue-300 text-sm'>Current setting</p>
                    </div>
                  </div>
                </div>
                <div className='text-xl font-bold text-blue-400'>
                  {Math.floor(parseInt(contractStats.pingInterval) / 3600)}h{' '}
                  {Math.floor(
                    (parseInt(contractStats.pingInterval) % 3600) / 60
                  )}
                  m
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className='p-6 bg-gradient-to-br from-pink-900/20 to-rose-900/20 border-pink-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Zap className='h-8 w-8 text-pink-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Breed Cost
                      </h3>
                      <p className='text-pink-300 text-sm'>Current price</p>
                    </div>
                  </div>
                </div>
                <div className='text-xl font-bold text-pink-400'>
                  {formatWithCommas(
                    parseFloat(contractStats.currentBreedCost).toFixed(2)
                  )}{' '}
                  CRAA
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className='p-6 bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-amber-500/30'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <Activity className='h-8 w-8 text-amber-400 mr-3' />
                    <div>
                      <h3 className='text-lg font-bold text-white'>
                        Dynamic Rate
                      </h3>
                      <p className='text-amber-300 text-sm'>
                        Rewards per second
                      </p>
                    </div>
                  </div>
                </div>
                <div className='text-xl font-bold text-amber-400'>
                  {parseFloat(contractStats.rewardRatePerSecond).toFixed(0)}{' '}
                  CRAA/s
                </div>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Source Info */}
      <div className='text-center'>
        <p className='text-slate-400 text-sm'>
          Data pulled directly from CrazyCubeUltimate3_Safe on ApeChain •
          Updates every 2 minutes
        </p>
      </div>
    </div>
  );
}
