'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users,
  Trophy,
  Search,
  Zap,
  Flame,
  Heart,
  Coins,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

const DENIS_3_ENDPOINT =
  'https://api.studio.thegraph.com/query/111010/denis-3/v0.0.3';

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

interface PlayerStats {
  totalPlayers: number;
  activePlayers: number;
  topPlayers: Player[];
  playerSearch: Player | null;
}

export default function PlayerAnalytics() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const topPlayersQuery = `
        query {
          players(first: 20, orderBy: totalPings, orderDirection: desc) {
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
      `;

      const response = await fetch(DENIS_3_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topPlayersQuery }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error('GraphQL errors in response');
      }

      const players = data.data?.players || [];

      // Calculate active players (activity in last 7 days)
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 7 * 24 * 3600;
      const activePlayers = players.filter(
        (p: Player) => parseInt(p.lastActivityAt) >= sevenDaysAgo
      ).length;

      setStats({
        totalPlayers: players.length,
        activePlayers,
        topPlayers: players,
        playerSearch: null,
      });
    } catch {
      setError('Failed to load player statistics');
    } finally {
      setLoading(false);
    }
  };

  const searchPlayer = async () => {
    if (!searchAddress.trim()) return;

    try {
      setSearchLoading(true);

      const playerQuery = `
        query {
          player(id: "${searchAddress.toLowerCase()}") {
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
      `;

      const response = await fetch(DENIS_3_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: playerQuery }),
      });

      const data = await response.json();

      if (data.data?.player) {
        setStats(prev =>
          prev
            ? {
                ...prev,
                playerSearch: data.data.player,
              }
            : null
        );
      } else {
        setStats(prev =>
          prev
            ? {
                ...prev,
                playerSearch: null,
              }
            : null
        );
      }
    } catch (err) {
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerStats();
    const interval = setInterval(fetchPlayerStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('ru-RU');
  };

  const getActivityLevel = (player: Player) => {
    const total = player.totalPings + player.totalBurns + player.totalBreeds;
    if (total >= 50)
      return {
        level: 'Legendary',
        color: 'text-yellow-400',
        bg: 'bg-yellow-900/20',
      };
    if (total >= 20)
      return {
        level: 'Expert',
        color: 'text-purple-400',
        bg: 'bg-purple-900/20',
      };
    if (total >= 10)
      return { level: 'Active', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (total >= 5)
      return {
        level: 'Casual',
        color: 'text-green-400',
        bg: 'bg-green-900/20',
      };
    return { level: 'Beginner', color: 'text-gray-400', bg: 'bg-gray-900/20' };
  };

  if (loading) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400'></div>
          <span className='ml-3 text-slate-300'>
            Loading player analytics...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='text-center text-red-400'>
          <Users className='h-12 w-12 mx-auto mb-4' />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-blue-500/30'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center'>
              <Users className='h-6 w-6 mr-2 text-blue-400' />
              Player Analytics
            </h2>
            <p className='text-blue-300 mt-1'>
              Detailed analytics of player activity
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-white'>
                {stats.totalPlayers}
              </p>
              <p className='text-blue-300 text-sm'>Total players</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-400'>
                {stats.activePlayers}
              </p>
              <p className='text-green-300 text-sm'>Active (7d)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Player Search */}
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
          <Search className='h-5 w-5 mr-2 text-purple-400' />
          Player search
        </h3>

        <div className='flex gap-3 mb-4'>
          <Input
            placeholder='Enter player address (0x...)'
            value={searchAddress}
            onChange={e => setSearchAddress(e.target.value)}
            className='bg-slate-900/50 border-slate-600 text-white'
            onKeyPress={e => e.key === 'Enter' && searchPlayer()}
          />
          <Button
            onClick={searchPlayer}
            disabled={searchLoading || !searchAddress.trim()}
            className='bg-purple-600 hover:bg-purple-700'
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {stats.playerSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-900/50 rounded-lg p-4 border border-purple-500/30'
          >
            <div className='flex justify-between items-start mb-4'>
              <div>
                <p className='text-white font-semibold'>
                  {formatAddress(stats.playerSearch.address)}
                </p>
                <Badge
                  className={
                    getActivityLevel(stats.playerSearch).bg +
                    ' ' +
                    getActivityLevel(stats.playerSearch).color
                  }
                >
                  {getActivityLevel(stats.playerSearch).level}
                </Badge>
              </div>
              <div className='text-right'>
                <p className='text-slate-400 text-sm'>First activity</p>
                <p className='text-slate-300'>
                  {formatTime(stats.playerSearch.firstSeenAt)}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <p className='text-blue-400 text-2xl font-bold'>
                  {stats.playerSearch.totalPings}
                </p>
                <p className='text-slate-400 text-sm'>Pings</p>
              </div>
              <div className='text-center'>
                <p className='text-red-400 text-2xl font-bold'>
                  {stats.playerSearch.totalBurns}
                </p>
                <p className='text-slate-400 text-sm'>Burns</p>
              </div>
              <div className='text-center'>
                <p className='text-green-400 text-2xl font-bold'>
                  {stats.playerSearch.totalBreeds}
                </p>
                <p className='text-slate-400 text-sm'>Breeds</p>
              </div>
              <div className='text-center'>
                <p className='text-yellow-400 text-2xl font-bold'>
                  {stats.playerSearch.totalClaims}
                </p>
                <p className='text-slate-400 text-sm'>Claims</p>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Top Players */}
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <h3 className='text-xl font-bold text-white mb-6 flex items-center'>
          <Trophy className='h-5 w-5 mr-2 text-yellow-400' />
          Top players
        </h3>

        <div className='space-y-3'>
          {stats.topPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className='bg-slate-900/50 rounded-lg p-4 border border-slate-600/30'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                            ? 'bg-orange-600'
                            : 'bg-slate-600'
                    }`}
                  >
                    <span className='text-white font-bold text-sm'>
                      #{index + 1}
                    </span>
                  </div>

                  <div>
                    <p className='text-white font-semibold'>
                      {formatAddress(player.address)}
                    </p>
                    <Badge
                      className={
                        getActivityLevel(player).bg +
                        ' ' +
                        getActivityLevel(player).color +
                        ' text-xs'
                      }
                    >
                      {getActivityLevel(player).level}
                    </Badge>
                  </div>
                </div>

                <div className='flex items-center space-x-4 text-sm'>
                  <div className='flex items-center'>
                    <Zap className='h-4 w-4 text-blue-400 mr-1' />
                    <span className='text-blue-400'>{player.totalPings}</span>
                  </div>
                  <div className='flex items-center'>
                    <Flame className='h-4 w-4 text-red-400 mr-1' />
                    <span className='text-red-400'>{player.totalBurns}</span>
                  </div>
                  <div className='flex items-center'>
                    <Heart className='h-4 w-4 text-green-400 mr-1' />
                    <span className='text-green-400'>{player.totalBreeds}</span>
                  </div>
                  <div className='flex items-center'>
                    <Coins className='h-4 w-4 text-yellow-400 mr-1' />
                    <span className='text-yellow-400'>
                      {player.totalClaims}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
