'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Zap,
  Heart,
  Star,
  Skull,
  Timer,
  Info,
  Search,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
// Network calls are intentionally disabled in this build of the inspector.
// The component now uses local mocked data only so it cannot reach any RPC
// or contract ABI. This ensures the inspector is fully disconnected.

interface NFTData {
  tokenId: string;
  owner: string;
  exists: boolean;
  activated: boolean;
  rarity: number;
  stars: number;
  bonusStars: number;
  inGraveyard: boolean;
  lastPingTime: number;
  lastBreedTime: number;
  lockedOcta: string;
  dynBonusBps: number;
  specBps: number;
  gender: number; // 1 = boy, 2 = girl
}

interface BurnInfo {
  owner: string;
  totalAmount: string;
  claimAt: number;
  graveReleaseAt: number;
  claimed: boolean;
  waitMinutes: number;
  playerAmount: string;
  poolAmount: string;
  burnedAmount: string;
}

export default function NFTInspectorFixed() {
  const { t } = useTranslation();
  const [tokenId, setTokenId] = useState('');
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [burnInfo, setBurnInfo] = useState<BurnInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));

  // Network disabled intentionally — the inspector will not perform any RPC
  // or contract calls. Use deterministic mock data instead.
  const NETWORK_ENABLED = false;
  const DEBUG_READER_ADDRESS = NETWORK_ENABLED ? 'ENABLED' : 'DISABLED (no network)';
  const DEBUG_RPC = NETWORK_ENABLED ? 'ENABLED' : 'DISABLED (no network)';

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const inspectNFT = async () => {
    if (!tokenId.trim()) return;
    setLoading(true);
    setError(null);
    setNftData(null);
    setBurnInfo(null);

    try {
      // Deliberately no network calls. Produce deterministic mock data
      // so the UI can be tested without any RPC access.
      const tid = tokenId.trim();
      const now = Math.floor(Date.now() / 1000);

      const nftSummary: NFTData = {
        tokenId: tid,
        owner: '0x0000000000000000000000000000000000000000',
        exists: true,
        activated: false,
        rarity: Math.max(1, (Number(tid) % 6) || 1),
        stars: Math.max(0, (Number(tid) % 5)),
        bonusStars: 0,
        inGraveyard: Number(tid) % 2 === 0,
        lastPingTime: now - 3600,
        lastBreedTime: now - 7200,
        lockedOcta: '0.00',
        dynBonusBps: 0,
        specBps: 0,
        gender: (Number(tid) % 2) + 1, // 1 or 2
      };

      // slight delay to simulate processing
      await new Promise(r => setTimeout(r, 120));

      setNftData(nftSummary);

      if (nftSummary.inGraveyard) {
        const burnInfoData: BurnInfo = {
          owner: nftSummary.owner,
          totalAmount: '0.00',
          claimAt: now + 60 * 60 * 24,
          graveReleaseAt: now + 60 * 60 * 24 * 2,
          claimed: false,
          waitMinutes: 60 * 24,
          playerAmount: '0.00',
          poolAmount: '0.00',
          burnedAmount: '0.00',
        };

        setBurnInfo(burnInfoData);
      }
    } catch (e) {
      console.error('Mock inspect error', e);
      setError('Internal error while creating mock data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  const formatCRAA = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getGenderIcon = (gender: number) => {
    return gender === 1 ? '♂️' : '♀️'; // 1 = boy, 2 = girl
  };

  const getGenderText = (gender: number) => {
    return gender === 1 ? 'Boy' : 'Girl';
  };

  const getRarityColor = (rarity: number) => {
    const colors = {
      1: 'bg-gray-500',
      2: 'bg-green-500',
      3: 'bg-blue-500',
      4: 'bg-purple-500',
      5: 'bg-orange-500',
      6: 'bg-red-500',
    };
    return colors[rarity as keyof typeof colors] || 'bg-gray-500';
  };

  const getRarityName = (rarity: number) => {
    const names = {
      1: t('rarity.common', 'Common'),
      2: t('rarity.uncommon', 'Uncommon'),
      3: t('rarity.rare', 'Rare'),
      4: t('rarity.epic', 'Epic'),
      5: t('rarity.legendary', 'Legendary'),
      6: t('rarity.mythic', 'Mythic'),
    };
    return (
      names[rarity as keyof typeof names] || t('rarity.unknown', 'Unknown')
    );
  };

  return (
    <Card className='w-full p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-bold text-white flex items-center'>
          <Clock className='h-5 w-5 mr-2 text-blue-400' />
          {t('info.nftInspector', 'NFT Inspector (Fixed) 1')}
          {/* Live indicator */}
          <div className='flex items-center ml-2'>
            <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse'></div>
            <span className='text-xs text-green-300 ml-1'>
              {t('sections.ping.live', 'Live')}
            </span>
          </div>
        </h3>
        {/* Debug info: reader address + RPC */}
        <div className='text-xs text-slate-400'>
          <div>Reader: <span className='font-mono text-white'>{DEBUG_READER_ADDRESS}</span></div>
          <div>RPC: <span className='font-mono text-white'>{DEBUG_RPC}</span></div>
        </div>
      </div>

      {/* Search Input */}
      <div className='flex gap-2 mb-4'>
        <Input
          type='number'
          placeholder='Enter any NFT ID (1-9700)'
          value={tokenId}
          onChange={e => setTokenId(e.target.value)}
          className='bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 h-9'
          onKeyPress={e => e.key === 'Enter' && inspectNFT()}
        />
        <Button
          onClick={inspectNFT}
          disabled={loading || !tokenId.trim()}
          className='bg-blue-600 hover:bg-blue-700 h-9 px-3'
        >
          {loading ? (
            <RefreshCw className='h-4 w-4 animate-spin' />
          ) : (
            <Search className='h-4 w-4' />
          )}
        </Button>
      </div>

      {/* Info Message */}
      <div className='bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4 text-sm'>
        <div className='flex items-center'>
          <Info className='h-5 w-5 text-blue-400 mr-2' />
          <span className='text-blue-300'>
            {t(
              'info.inspectorReady',
              'NFT Inspector ready - enter any NFT ID to view stats'
            )}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4'>
          <p className='text-red-300 text-sm'>{error}</p>
        </div>
      )}

      {/* NFT Data Display */}
      {nftData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-3'
        >
          {/* Basic Info */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2'>
            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>NFT ID</span>
                <Star className='h-3 w-3 text-yellow-400' />
              </div>
              <p className='text-lg font-bold text-white'>#{nftData.tokenId}</p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>Gender</span>
                <span className='text-lg'>
                  {getGenderIcon(nftData.gender)}
                </span>
              </div>
              <p className='text-base font-bold text-white'>
                {getGenderText(nftData.gender)}
              </p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>
                  {t('info.rarity', 'Rarity')}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${getRarityColor(nftData.rarity)}`}
                ></div>
              </div>
              <p className='text-base font-bold text-white'>
                {getRarityName(nftData.rarity)}
              </p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>
                  {t('info.stars', 'Stars')}
                </span>
                <span className='text-yellow-400 font-bold text-sm'>
                  {nftData.stars}
                </span>
              </div>
              <div className='flex space-x-1'>
                {Array.from({ length: nftData.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className='h-3 w-3 text-yellow-400 fill-yellow-400'
                  />
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>
                  {t('info.status', 'Status')}
                </span>
                {nftData.inGraveyard ? (
                  <Skull className='h-3 w-3 text-red-400' />
                ) : (
                  <Zap className='h-3 w-3 text-green-400' />
                )}
              </div>
              <p
                className={`text-base font-bold ${nftData.inGraveyard ? 'text-red-400' : 'text-green-400'}`}
              >
                {nftData.inGraveyard
                  ? t('info.graveyard', 'Graveyard')
                  : t('info.active', 'Active')}
              </p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>
                  {t('info.lockedCra', 'Locked CRAA')}
                </span>
              </div>
              <p className='text-base font-bold text-white'>
                {formatCRAA(nftData.lockedOcta)}
              </p>
            </div>
          </div>

          {/* Burn Info */}
          {nftData.inGraveyard && burnInfo && (
            <div className='bg-red-900/20 rounded-lg p-4 border border-red-500/30'>
              <div className='flex items-center justify-between mb-1'>
                <h4 className='text-sm font-semibold text-red-300 flex items-center'>
                  <Skull className='h-4 w-4 mr-1' />
                  {t('graveyard.title', 'Burn Information')}
                </h4>
                <Badge
                  variant={burnInfo.claimed ? 'secondary' : 'default'}
                  className='h-5 text-xs px-1.5'
                >
                  {burnInfo.claimed
                    ? t('status.claimed', 'Claimed')
                    : t('status.pending', 'Pending')}
                </Badge>
              </div>
              <div className='text-xs text-slate-300 space-y-1'>
                <div className='flex justify-between'>
                  <span>{t('info.totalReward', 'Total Reward')}:</span>{' '}
                  <span className='font-mono'>
                    {formatCRAA(burnInfo.totalAmount)} CRAA
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>{t('info.playerAmount', 'Player Amount')}:</span>{' '}
                  <span className='font-mono'>
                    {formatCRAA(burnInfo.playerAmount)} CRAA
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>{t('info.poolAmount', 'Pool Amount')}:</span>{' '}
                  <span className='font-mono'>
                    {formatCRAA(burnInfo.poolAmount)} CRAA
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>{t('info.burnedAmount', 'Burned Amount')}:</span>{' '}
                  <span className='font-mono'>
                    {formatCRAA(burnInfo.burnedAmount)} CRAA
                  </span>
                </div>
                {!burnInfo.claimed && (
                  <div className='flex justify-between'>
                    <span>{t('info.claimAvailable', 'Claim Available')}:</span>{' '}
                    <span
                      className={`font-mono ${nowSec >= burnInfo.claimAt ? 'text-green-400' : 'text-orange-400'}`}
                    >
                      {formatTime(Math.max(0, burnInfo.claimAt - nowSec))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timing Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='bg-blue-900/20 rounded-lg p-4 border border-blue-500/30'>
              <h4 className='text-sm font-semibold text-blue-300 mb-1 flex items-center'>
                <Zap className='h-4 w-4 mr-1' />
                {t('info.lastPing', 'Last Ping')}
                <span className='ml-1 text-xs'>{getGenderIcon(nftData.gender)}</span>
              </h4>
              <p className='text-sm text-white'>
                {nftData.lastPingTime > 0
                  ? new Date(nftData.lastPingTime * 1000).toLocaleString()
                  : t('info.never', 'Never')}
              </p>
            </div>

            <div className='bg-green-900/20 rounded-lg p-4 border border-green-500/30'>
              <h4 className='text-sm font-semibold text-green-300 mb-1 flex items-center'>
                <Heart className='h-4 w-4 mr-1' />
                {t('info.lastBreed', 'Last Breed')}
              </h4>
              <p className='text-sm text-white'>
                {nftData.lastBreedTime > 0
                  ? new Date(nftData.lastBreedTime * 1000).toLocaleString()
                  : t('info.never', 'Never')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Compact placeholder when no data */}
      {!nftData && !error && (
        <div className='text-center py-8'>
          <Timer className='h-8 w-8 text-slate-500 mx-auto mb-2' />
          <p className='text-slate-400 text-sm'>
            {t('info.enterNftId', 'Enter NFT ID to inspect')}
          </p>
        </div>
      )}
    </Card>
  );
}