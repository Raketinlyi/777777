'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Flame,
  TrendingUp,
  Users,
  Clock,
  Star,
  Coins,
  Database,
  BarChart3,
  Zap,
  Target,
  Timer,
  Heart,
  Skull,
} from 'lucide-react';
import { motion } from 'framer-motion';

const DENIS_3_ENDPOINT =
  'https://api.studio.thegraph.com/query/111010/denis-3/v0.0.3';

interface GlobalStats {
  id: string;
  totalBurns: number;
  totalPings: number;
  totalBreeds: number;
  totalActiveNFTs: number;
  totalInGraveyard: number;
  totalStars: string;
  pingInterval: string;
  breedCooldown: string;
  lastUpdated: string;
}

interface ContractStats {
  id: string;
  totalCRABurned: string;
  totalTokensBurned: string;
  totalStars: string;
  totalPings: number;
  totalBreeds: number;
  totalBurns: number;
  totalClaims: number;
  totalActivations: number;
  pingInterval: string;
  breedCooldown: string;
  graveyardCooldown: string;
  maxAccumulationPeriod: string;
  manualFloorPrice: string;
  totalCRADistributed: string;
  graveyardSize: string;
  lastUpdated: string;
}

interface Player {
  id: string;
  address: string;
  totalPings: number;
  totalBurns: number;
  totalBreeds: number;
  totalClaims: number;
  totalRewardsEarned: string;
  totalRewardsClaimed: string;
  firstSeenAt: string;
  lastActivityAt: string;
}

interface NFTBurn {
  id: string;
  tokenId: string;
  player: string;
  amountToClaim: string;
  waitHours: string;
  timestamp: string;
  blockNumber: string;
}

interface NFTPing {
  id: string;
  tokenId: string;
  player: string;
  reward: string;
  timestamp: string;
  blockNumber: string;
}

export default function Denis3Analytics() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [contractStats, setContractStats] = useState<ContractStats | null>(
    null
  );
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [recentBurns, setRecentBurns] = useState<NFTBurn[]>([]);
  const [recentPings, setRecentPings] = useState<NFTPing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubgraphData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queries = [
        {
          name: 'globalStats',
          query: `
            query {
              globalStats(id: "1") {
                id
                totalBurns
                totalPings
                totalBreeds
                totalActiveNFTs
                totalInGraveyard
                totalStars
                pingInterval
                breedCooldown
                lastUpdated
              }
            }
          `,
        },
        {
          name: 'contractStats',
          query: `
            query {
              contractStats(id: "contract") {
                id
                totalCRABurned
                totalTokensBurned
                totalStars
                totalPings
                totalBreeds
                totalBurns
                totalClaims
                totalActivations
                pingInterval
                breedCooldown
                graveyardCooldown
                maxAccumulationPeriod
                manualFloorPrice
                totalCRADistributed
                graveyardSize
                lastUpdated
              }
            }
          `,
        },
        {
          name: 'topPlayers',
          query: `
            query {
              players(first: 10, orderBy: totalPings, orderDirection: desc) {
                id
                address
                totalPings
                totalBurns
                totalBreeds
                totalClaims
                totalRewardsEarned
                totalRewardsClaimed
                firstSeenAt
                lastActivityAt
              }
            }
          `,
        },
        {
          name: 'recentBurns',
          query: `
            query {
              recentBurns: [] 
            }
          `,
        },
        {
          name: 'recentPings',
          query: `
            query {
              recentPings: []
            }
          `,
        },
      ];

      const results = await Promise.all(
        queries.map(async ({ query }) => {
          const response = await fetch(DENIS_3_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          const data = await response.json();
          return data;
        })
      );

      // Process results
      if (results[0]?.data?.globalStats) {
        setGlobalStats(results[0].data.globalStats);
      }

      if (results[1]?.data?.contractStats) {
        setContractStats(results[1].data.contractStats);
      }

      if (results[2]?.data?.players) {
        setTopPlayers(results[2].data.players);
      }

      if (results[3]?.data?.recentBurns) {
        setRecentBurns(results[3].data.recentBurns);
      }

      if (results[4]?.data?.recentPings) {
        setRecentPings(results[4].data.recentPings);
      }
    } catch {
      setError('Failed to load subgraph data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubgraphData();
    const interval = setInterval(fetchSubgraphData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US').format(n);
  };

  const formatCRA = (amount: string) => {
    const num = parseFloat(amount) / 1e18;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('en-US');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCooldownInfo = (contractStats: ContractStats) => {
    const pingSeconds = parseInt(contractStats.pingInterval);
    const breedSeconds = parseInt(contractStats.breedCooldown);
    const graveyardSeconds = parseInt(contractStats.graveyardCooldown);
    const maxAccumSeconds = parseInt(contractStats.maxAccumulationPeriod);

    return {
      ping: `${pingSeconds / 60} min`,
      breed: `${breedSeconds / 60} min`,
      graveyard: `${graveyardSeconds / 60} min`,
      maxAccumulation: `${maxAccumSeconds / 60} min`,
    };
  };

  /* ---------------------------------------------
     Derived & Sanitised Global Metrics
     -------------------------------------------*/
  const COLLECTION_SIZE = 5000;
  const burns = globalStats?.totalBurns ?? 0;
  const breeds = globalStats?.totalBreeds ?? 0;
  const inGraveyard = Math.max(burns - breeds, 0);
  const activeNfts = Math.max(COLLECTION_SIZE - inGraveyard, 0);

  if (loading) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400'></div>
          <span className='ml-3 text-slate-300'>Loading subgraph data...</span>
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6 bg-gradient-to-r from-violet-900/50 to-indigo-900/50 backdrop-blur-sm border-violet-500/30'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center'>
              <Database className='h-6 w-6 mr-2 text-violet-400' />
              Live Analytics
            </h2>
            <p className='text-violet-300 mt-1'>
              Full real-time analytics via subgraph
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='h-2 w-2 bg-green-400 rounded-full animate-pulse'></div>
            <span className='text-green-400 text-sm'>Live</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList className='bg-slate-800/50 p-1 backdrop-blur-sm'>
          <TabsTrigger value='overview'>
            <BarChart3 className='h-4 w-4 mr-2' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='cooldowns'>
            <Timer className='h-4 w-4 mr-2' />
            Cooldowns
          </TabsTrigger>
          <TabsTrigger value='activity'>
            <Activity className='h-4 w-4 mr-2' />
            Activity
          </TabsTrigger>
          <TabsTrigger value='players'>
            <Users className='h-4 w-4 mr-2' />
            Players
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          {/* Derive stable counts to avoid negatives & overflow */}
          {globalStats && (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
              {/* Burns */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className='p-4 bg-red-900/20 border-red-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-red-300 text-sm'>Burns</p>
                      <p className='text-2xl font-bold text-white'>
                        {formatNumber(burns)}
                      </p>
                    </div>
                    <Flame className='h-8 w-8 text-red-400' />
                  </div>
                </Card>
              </motion.div>

              {/* Pings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className='p-4 bg-blue-900/20 border-blue-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-blue-300 text-sm'>Pings</p>
                      <p className='text-2xl font-bold text-white'>
                        {formatNumber(globalStats.totalPings)}
                      </p>
                    </div>
                    <Zap className='h-8 w-8 text-blue-400' />
                  </div>
                </Card>
              </motion.div>

              {/* Breeds */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className='p-4 bg-green-900/20 border-green-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-green-300 text-sm'>Breeds</p>
                      <p className='text-2xl font-bold text-white'>
                        {formatNumber(breeds)}
                      </p>
                    </div>
                    <Heart className='h-8 w-8 text-green-400' />
                  </div>
                </Card>
              </motion.div>

              {/* Active NFTs (derived) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className='p-4 bg-purple-900/20 border-purple-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-purple-300 text-sm'>Active NFTs</p>
                      <p className='text-2xl font-bold text-white'>
                        {formatNumber(activeNfts)}
                      </p>
                    </div>
                    <Target className='h-8 w-8 text-purple-400' />
                  </div>
                </Card>
              </motion.div>

              {/* In Graveyard (derived) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className='p-4 bg-gray-900/20 border-gray-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-gray-300 text-sm'>In Graveyard</p>
                      <p className='text-2xl font-bold text-white'>
                        {formatNumber(inGraveyard)}
                      </p>
                    </div>
                    <Skull className='h-8 w-8 text-gray-400' />
                  </div>
                </Card>
              </motion.div>

              {/* Total Stars (deprecated) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className='p-4 bg-yellow-900/20 border-yellow-500/30'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-yellow-300 text-sm'>Total stars</p>
                      <p className='text-2xl font-bold text-white'>N/A</p>
                    </div>
                    <Star className='h-8 w-8 text-yellow-400' />
                  </div>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Contract Stats */}
          {contractStats && (
            <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
              <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
                <Coins className='h-5 w-5 mr-2 text-orange-400' />
                Contract statistics
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>CRA burned:</span>
                    <span className='text-orange-400 font-semibold'>
                      {formatCRA(contractStats.totalCRABurned)} CRA
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>CRA distributed:</span>
                    <span className='text-green-400 font-semibold'>
                      {formatCRA(contractStats.totalCRADistributed)} CRA
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>Floor Price:</span>
                    <span className='text-blue-400 font-semibold'>
                      {formatCRA(contractStats.manualFloorPrice)} CRA
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>Total activations:</span>
                    <span className='text-purple-400 font-semibold'>
                      {formatNumber(contractStats.totalActivations)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>Total claims:</span>
                    <span className='text-green-400 font-semibold'>
                      {formatNumber(contractStats.totalClaims)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>Graveyard size:</span>
                    <span className='text-red-400 font-semibold'>
                      {formatNumber(contractStats.graveyardSize)}
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>Total stars:</span>
                    <span className='text-yellow-400 font-semibold'>N/A</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-400'>Last updated:</span>
                    <span className='text-slate-300 text-sm'>
                      {formatTime(contractStats.lastUpdated)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Cooldowns Tab */}
        <TabsContent value='cooldowns' className='space-y-6'>
          {contractStats && (
            <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
              <h3 className='text-xl font-bold text-white mb-6 flex items-center'>
                <Clock className='h-5 w-5 mr-2 text-blue-400' />
                All system cooldowns
              </h3>

              {(() => {
                const cs = contractStats as ContractStats; // non-null inside this scope
                const cooldowns = getCooldownInfo(cs);
                return (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='bg-blue-900/20 rounded-lg p-4 border border-blue-500/30'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-blue-300 font-semibold'>
                          Ping Cooldown
                        </span>
                        <Zap className='h-5 w-5 text-blue-400' />
                      </div>
                      <p className='text-2xl font-bold text-white'>
                        {cooldowns.ping}
                      </p>
                      <p className='text-blue-300 text-sm mt-1'>
                        Between NFT pings
                      </p>
                    </div>

                    <div className='bg-green-900/20 rounded-lg p-4 border border-green-500/30'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-green-300 font-semibold'>
                          Breed Cooldown
                        </span>
                        <Heart className='h-5 w-5 text-green-400' />
                      </div>
                      <p className='text-2xl font-bold text-white'>
                        {cooldowns.breed}
                      </p>
                      <p className='text-green-300 text-sm mt-1'>
                        Between breeds
                      </p>
                    </div>

                    <div className='bg-red-900/20 rounded-lg p-4 border border-red-500/30'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-red-300 font-semibold'>
                          Graveyard Cooldown
                        </span>
                        <Skull className='h-5 w-5 text-red-400' />
                      </div>
                      <p className='text-2xl font-bold text-white'>
                        {cooldowns.graveyard}
                      </p>
                      <p className='text-red-300 text-sm mt-1'>In Graveyard</p>
                    </div>

                    <div className='bg-purple-900/20 rounded-lg p-4 border border-purple-500/30'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-purple-300 font-semibold'>
                          Max Accumulation
                        </span>
                        <Timer className='h-5 w-5 text-purple-400' />
                      </div>
                      <p className='text-2xl font-bold text-white'>
                        {cooldowns.maxAccumulation}
                      </p>
                      <p className='text-purple-300 text-sm mt-1'>
                        Max accumulation
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className='mt-6 p-4 bg-slate-900/50 rounded-lg'>
                <h4 className='text-lg font-semibold text-slate-200 mb-3'>
                  Cooldown explanation:
                </h4>
                <div className='space-y-2 text-sm text-slate-300'>
                  <p>
                    <strong className='text-blue-400'>Ping Cooldown:</strong>{' '}
                    Time between pings of a single NFT to earn rewards
                  </p>
                  <p>
                    <strong className='text-green-400'>Breed Cooldown:</strong>{' '}
                    Time between breeds (NFT needs rest after breeding)
                  </p>
                  <p>
                    <strong className='text-red-400'>
                      Graveyard Cooldown:
                    </strong>{' '}
                    Waiting time in graveyard before claiming
                  </p>
                  <p>
                    <strong className='text-purple-400'>
                      Max Accumulation:
                    </strong>{' '}
                    Maximum reward accumulation time without ping
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value='activity' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Recent Burns */}
            <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
              <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
                <Flame className='h-5 w-5 mr-2 text-red-400' />
                Recent Burns
              </h3>

              {recentBurns.length > 0 ? (
                <div className='space-y-3'>
                  {recentBurns.map((burn, index) => (
                    <motion.div
                      key={burn.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='bg-slate-900/50 rounded-lg p-3 border border-red-500/20'
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <p className='text-white font-semibold'>
                            NFT #{burn.tokenId}
                          </p>
                          <p className='text-slate-400 text-sm'>
                            by {formatAddress(burn.player)}
                          </p>
                          <p className='text-red-400 text-sm'>
                            {formatCRA(burn.amountToClaim)} CRA
                          </p>
                        </div>
                        <div className='text-right'>
                          <Badge
                            variant='outline'
                            className='border-red-500/30 text-red-300'
                          >
                            {burn.waitHours}h
                          </Badge>
                          <p className='text-slate-400 text-xs mt-1'>
                            {formatTime(burn.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className='text-slate-400 text-center py-8'>
                  Data is loading...
                </p>
              )}
            </Card>

            {/* Recent Pings */}
            <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
              <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
                <Zap className='h-5 w-5 mr-2 text-blue-400' />
                Recent Pings
              </h3>

              {recentPings.length > 0 ? (
                <div className='space-y-3'>
                  {recentPings.map((ping, index) => (
                    <motion.div
                      key={ping.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='bg-slate-900/50 rounded-lg p-3 border border-blue-500/20'
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <p className='text-white font-semibold'>
                            NFT #{ping.tokenId}
                          </p>
                          <p className='text-slate-400 text-sm'>
                            by {formatAddress(ping.player)}
                          </p>
                          <p className='text-blue-400 text-sm'>
                            +{formatCRA(ping.reward)} CRA
                          </p>
                        </div>
                        <div className='text-right'>
                          <Badge
                            variant='outline'
                            className='border-blue-500/30 text-blue-300'
                          >
                            Block #{parseInt(ping.blockNumber).toLocaleString()}
                          </Badge>
                          <p className='text-slate-400 text-xs mt-1'>
                            {formatTime(ping.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className='text-slate-400 text-center py-8'>
                  Data is loading...
                </p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value='players' className='space-y-6'>
          <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
            <h3 className='text-xl font-bold text-white mb-6 flex items-center'>
              <Users className='h-5 w-5 mr-2 text-purple-400' />
              Top players by activity
            </h3>

            {topPlayers.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-slate-700'>
                      <th className='text-left py-3 text-slate-400'>#</th>
                      <th className='text-left py-3 text-slate-400'>Address</th>
                      <th className='text-right py-3 text-slate-400'>Pings</th>
                      <th className='text-right py-3 text-slate-400'>Burns</th>
                      <th className='text-right py-3 text-slate-400'>Breeds</th>
                      <th className='text-right py-3 text-slate-400'>Claims</th>
                      <th className='text-right py-3 text-slate-400'>Earned</th>
                      <th className='text-right py-3 text-slate-400'>
                        Last activity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlayers.map((player, index) => (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className='border-b border-slate-700/50 hover:bg-slate-700/20'
                      >
                        <td className='py-3 text-slate-300'>#{index + 1}</td>
                        <td className='py-3'>
                          <code className='text-purple-400 bg-slate-900/50 px-2 py-1 rounded text-xs'>
                            {formatAddress(player.address)}
                          </code>
                        </td>
                        <td className='py-3 text-right text-blue-400 font-semibold'>
                          {formatNumber(player.totalPings)}
                        </td>
                        <td className='py-3 text-right text-red-400 font-semibold'>
                          {formatNumber(player.totalBurns)}
                        </td>
                        <td className='py-3 text-right text-green-400 font-semibold'>
                          {formatNumber(player.totalBreeds)}
                        </td>
                        <td className='py-3 text-right text-yellow-400 font-semibold'>
                          {formatNumber(player.totalClaims)}
                        </td>
                        <td className='py-3 text-right text-orange-400 font-semibold'>
                          {formatCRA(player.totalRewardsEarned)} CRA
                        </td>
                        <td className='py-3 text-right text-slate-400 text-xs'>
                          {formatTime(player.lastActivityAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-slate-400 text-center py-8'>
                Player data is loading...
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
