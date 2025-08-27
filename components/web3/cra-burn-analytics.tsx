'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Coins,
  Target,
  BarChart3,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DENIS_3_ENDPOINT =
  'https://api.studio.thegraph.com/query/111010/denis-3/v0.0.3';

interface BurnAnalytics {
  totalCRABurned: string;
  totalTokensBurned: string;
  totalBurns: number;
  totalClaims: number;
  totalActivations: number;
  graveyardSize: string;
  totalCRADistributed: string;
  recentClaims: {
    id: string;
    tokenId: string;
    player: string;
    playerShare: string;
    burnedShare: string;
    totalAmount: string;
    timestamp: string;
  }[];
}

export default function CRABurnAnalytics() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<BurnAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBurnAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const contractStatsQuery = `
        query {
          contractStats(id: "contract") {
            totalCRABurned
            totalTokensBurned
            totalBurns
            totalClaims
            totalActivations
            graveyardSize
            totalCRADistributed
          }
        }
      `;

      const recentClaimsQuery = `
        query {
          rewardClaims(first: 10, orderBy: timestamp, orderDirection: desc) {
            id
            tokenId
            player
            playerShare
            burnedShare
            totalAmount
            timestamp
          }
        }
      `;

      const [contractResponse, claimsResponse] = await Promise.all([
        fetch(DENIS_3_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: contractStatsQuery }),
        }),
        fetch(DENIS_3_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: recentClaimsQuery }),
        }),
      ]);

      const contractData = await contractResponse.json();
      const claimsData = await claimsResponse.json();

      if (contractData.errors || claimsData.errors) {
        throw new Error('GraphQL errors in response');
      }

      const contractStats = contractData.data?.contractStats;
      const recentClaims = claimsData.data?.rewardClaims || [];

      if (!contractStats) {
        throw new Error('No contract stats available');
      }

      const analyticsData: BurnAnalytics = {
        totalCRABurned: contractStats.totalCRABurned,
        totalTokensBurned: contractStats.totalTokensBurned,
        totalBurns: parseInt(contractStats.totalBurns),
        totalClaims: parseInt(contractStats.totalClaims),
        totalActivations: parseInt(contractStats.totalActivations),
        graveyardSize: contractStats.graveyardSize,
        totalCRADistributed: contractStats.totalCRADistributed,
        recentClaims,
      };

      setAnalytics(analyticsData);
    } catch {
      setError('Failed to load burn analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBurnAnalytics();
    const interval = setInterval(fetchBurnAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCRAA = (amount: string) => {
    const num = parseFloat(amount) / 1e18;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400'></div>
          <span className='ml-3 text-slate-300'>Loading burn analytics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='text-center text-red-400'>
          <Flame className='h-12 w-12 mx-auto mb-4' />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6 bg-gradient-to-r from-orange-900/50 to-red-900/50 backdrop-blur-sm border-orange-500/30'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center'>
              <Flame className='h-6 w-6 mr-2 text-orange-400' />
              {t('burn.header')}
            </h2>
            <p className='text-orange-300 mt-1'>{t('burn.subtitle')}</p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='h-2 w-2 bg-orange-400 rounded-full animate-pulse'></div>
            <span className='text-orange-400 text-sm'>{t('burn.live')}</span>
          </div>
        </div>
      </Card>

      {/* Overview Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='p-4 bg-red-900/20 border-red-500/30'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-red-300 text-sm'>Total CRAA burned</p>
                <p className='text-2xl font-bold text-white'>
                  {formatCRAA(analytics.totalCRABurned)} CRAA
                </p>
              </div>
              <Flame className='h-8 w-8 text-red-400' />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='p-4 bg-orange-900/20 border-orange-500/30'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-orange-300 text-sm'>NFTs burned</p>
                <p className='text-2xl font-bold text-white'>
                  {formatNumber(analytics.totalBurns)}
                </p>
              </div>
              <Target className='h-8 w-8 text-orange-400' />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className='p-4 bg-green-900/20 border-green-500/30'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-green-300 text-sm'>CRAA distributed</p>
                <p className='text-2xl font-bold text-white'>
                  {formatCRAA(analytics.totalCRADistributed)} CRAA
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-green-400' />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className='p-4 bg-purple-900/20 border-purple-500/30'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-purple-300 text-sm'>Claims</p>
                <p className='text-2xl font-bold text-white'>
                  {formatNumber(analytics.totalClaims)}
                </p>
              </div>
              <Coins className='h-8 w-8 text-purple-400' />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
          <h3 className='text-lg font-bold text-white mb-4 flex items-center'>
            <BarChart3 className='h-5 w-5 mr-2 text-blue-400' />
            Activity statistics
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-slate-400'>NFT activations:</span>
              <span className='text-blue-400 font-semibold'>
                {formatNumber(analytics.totalActivations)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-400'>In graveyard:</span>
              <span className='text-red-400 font-semibold'>
                {formatNumber(parseInt(analytics.graveyardSize))}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-400'>Tokens burned:</span>
              <span className='text-orange-400 font-semibold'>
                {formatCRAA(analytics.totalTokensBurned)}
              </span>
            </div>
          </div>
        </Card>

        <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
          <h3 className='text-lg font-bold text-white mb-4 flex items-center'>
            <TrendingUp className='h-5 w-5 mr-2 text-green-400' />
            Burn efficiency
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-slate-400'>Burn Rate:</span>
              <span className='text-green-400 font-semibold'>
                {analytics.totalBurns > 0
                  ? `${(parseInt(analytics.totalCRABurned) / 1e18 / analytics.totalBurns).toFixed(0)} CRAA/NFT`
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-400'>Claim Rate:</span>
              <span className='text-purple-400 font-semibold'>
                {analytics.totalBurns > 0
                  ? `${Math.round((analytics.totalClaims / analytics.totalBurns) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-400'>Avg Distribution:</span>
              <span className='text-yellow-400 font-semibold'>
                {analytics.totalClaims > 0
                  ? `${(parseInt(analytics.totalCRADistributed) / 1e18 / analytics.totalClaims).toFixed(0)} CRAA/claim`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
          <h3 className='text-lg font-bold text-white mb-4 flex items-center'>
            <Flame className='h-5 w-5 mr-2 text-orange-400' />
            Burn vs Distribution
          </h3>
          <div className='space-y-3'>
            <div>
              <div className='flex justify-between mb-1'>
                <span className='text-slate-400 text-sm'>Burned</span>
                <span className='text-red-400 text-sm'>
                  {formatCRAA(analytics.totalCRABurned)} CRAA
                </span>
              </div>
              <div className='w-full bg-slate-700 rounded-full h-2'>
                <div
                  className='h-2 bg-red-400 rounded-full'
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>

            <div>
              <div className='flex justify-between mb-1'>
                <span className='text-slate-400 text-sm'>Distributed</span>
                <span className='text-green-400 text-sm'>
                  {formatCRAA(analytics.totalCRADistributed)} CRAA
                </span>
              </div>
              <div className='w-full bg-slate-700 rounded-full h-2'>
                <div
                  className='h-2 bg-green-400 rounded-full'
                  style={{ width: '40%' }}
                ></div>
              </div>
            </div>

            <div className='pt-2 border-t border-slate-600'>
              <div className='flex justify-between'>
                <span className='text-slate-400 text-sm'>Burn Ratio:</span>
                <span className='text-orange-400 font-semibold'>
                  {parseInt(analytics.totalCRADistributed) > 0
                    ? `${(parseInt(analytics.totalCRABurned) / parseInt(analytics.totalCRADistributed)).toFixed(2)}x`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <h3 className='text-xl font-bold text-white mb-6 flex items-center'>
          <Clock className='h-5 w-5 mr-2 text-blue-400' />
          Recent reward claims
        </h3>

        {analytics.recentClaims.length > 0 ? (
          <div className='space-y-3'>
            {analytics.recentClaims.map((claim, index) => (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-slate-900/50 rounded-lg p-4 border border-green-500/20'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-white font-semibold'>
                      NFT #{claim.tokenId}
                    </p>
                    <p className='text-slate-400 text-sm'>
                      by {formatAddress(claim.player)}
                    </p>
                    <div className='mt-2 space-y-1'>
                      <p className='text-green-400 text-sm'>
                        To player: {formatCRAA(claim.playerShare)} CRAA
                      </p>
                      <p className='text-red-400 text-sm'>
                        Burned: {formatCRAA(claim.burnedShare)} CRAA
                      </p>
                      <p className='text-white text-sm'>
                        Total: {formatCRAA(claim.totalAmount)} CRAA
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <Badge
                      variant='outline'
                      className='border-green-500/30 text-green-300'
                    >
                      Claimed
                    </Badge>
                    <p className='text-slate-400 text-xs mt-1'>
                      {formatTime(claim.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className='text-slate-400 text-center py-8'>Data is loading...</p>
        )}
      </Card>
    </div>
  );
}
