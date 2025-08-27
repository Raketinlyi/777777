'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useCrazyCubeGame } from '@/hooks/useCrazyCubeGame';
import { useTranslation } from 'react-i18next';
import { createPublicClient, http, formatEther } from 'viem';
import { apeChain } from '@/config/chains';

interface NFTCooldownData {
  tokenId: string;
  rarity: number;
  initialStars: number;
  currentStars: number;
  isActivated: boolean;
  isInGraveyard: boolean;
  lockedCRAA: string;
  lastPingTime: number;
  lastBreedTime: number;
  canPing: boolean;
  canBreed: boolean;
  pingCooldownLeft: number;
  breedCooldownLeft: number;
  expectedReward: string;
  pendingPeriods: number;
  pendingCRAA: string;
  rarityBonusPct: number;
  burnLockedAmount?: string | undefined;
  burnTimeLeft?: number | undefined;
  canClaim?: boolean | undefined;
}

export default function NFTCooldownInspector() {
  const { t } = useTranslation();
  const [tokenId, setTokenId] = useState('');
  const [nftData, setNftData] = useState<NFTCooldownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));

  const {
    getNFTGameData,
    getBurnRecord,
    pingInterval,
    breedCooldown,
    isConnected,
  } = useCrazyCubeGame();

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const inspectNFT = async () => {
    if (!tokenId.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const gameData = await getNFTGameData(tokenId);
      if (!gameData) {
        setError('NFT not found or not activated');
        return;
      }

      const now = nowSec; // Use live time from state
      const pingCooldownLeft = Math.max(
        0,
        pingInterval - (now - gameData.lastPingTime)
      );
      const breedCooldownLeft = Math.max(
        0,
        breedCooldown - (now - gameData.lastBreedTime)
      );

      // --- NEW REWARD CALCULATION (matches Ping section) ---
      // Minimal ABI for only the required functions
      const MINI_ABI = [
        {
          name: 'sharePerPing',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ type: 'uint256' }],
        },
        {
          name: 'rarityBonusBps',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ type: 'uint8' }],
          outputs: [{ type: 'uint256' }],
        },
        {
          name: 'currentMultiplierBps',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ type: 'uint256' }],
          outputs: [{ type: 'uint256' }],
        },
      ] as const;

      const GAME_ADDR = apeChain.contracts.gameProxy.address as `0x${string}`;

      const client = createPublicClient({ chain: apeChain, transport: http() });

      const [sharePerPingWei, rarityBps, multiplierBps] = await Promise.all([
        client.readContract({
          address: GAME_ADDR,
          abi: MINI_ABI,
          functionName: 'sharePerPing',
        }) as Promise<bigint>,
        client.readContract({
          address: GAME_ADDR,
          abi: MINI_ABI,
          functionName: 'rarityBonusBps',
          args: [gameData.rarity],
        }) as Promise<bigint>,
        client.readContract({
          address: GAME_ADDR,
          abi: MINI_ABI,
          functionName: 'currentMultiplierBps',
          args: [BigInt(tokenId)],
        }) as Promise<bigint>,
      ]);

      // Base reward per ping
      const basePerPingWei = sharePerPingWei;
      // Apply rarity bonus
      const withRarityWei =
        basePerPingWei + (basePerPingWei * rarityBps) / 10000n;
      // Apply streak multiplier
      const totalPerPingWei = (withRarityWei * multiplierBps) / 10000n;

      const expectedRewardWei = totalPerPingWei;

      // Calculate pending periods & CRAA since last ping
      const periodsSinceLastPing = Math.floor(
        (now - gameData.lastPingTime) / pingInterval
      );
      const pendingPeriods =
        gameData.lastPingTime > 0 ? Math.max(0, periodsSinceLastPing) : 0;

      // Calculate partial pending for NFTs in cooldown (show accumulated even if period not complete)
      const partialPendingWei =
        gameData.lastPingTime > 0 && pingInterval > 0
          ? (expectedRewardWei * BigInt(now - gameData.lastPingTime)) /
            BigInt(pingInterval)
          : 0n;

      const pendingCRAAWei =
        gameData.lastPingTime > 0
          ? expectedRewardWei * BigInt(pendingPeriods)
          : 0n;

      // Use partial pending for cooldown NFTs, full pending for ready NFTs
      const displayPendingWei =
        pingCooldownLeft > 0 ? partialPendingWei : pendingCRAAWei;
      const pendingCRAA = Number(formatEther(displayPendingWei)).toFixed(2);

      // Bonus percentage (rarity + streak)
      const rarityPercent = Number(rarityBps) / 100;
      const streakPercent = (Number(multiplierBps) - 10000) / 100;
      const bonus = rarityPercent + streakPercent;

      const burn = await getBurnRecord(tokenId);

      const cooldownData: NFTCooldownData = {
        tokenId: gameData.tokenId,
        rarity: gameData.rarity,
        initialStars: gameData.initialStars,
        currentStars: gameData.currentStars,
        isActivated: gameData.lastPingTime > 0, // Fix: check if NFT was ever pinged
        isInGraveyard: gameData.isInGraveyard,
        lockedCRAA: gameData.lockedCRAA,
        lastPingTime: gameData.lastPingTime,
        lastBreedTime: gameData.lastBreedTime,
        canPing: pingCooldownLeft === 0,
        canBreed: breedCooldownLeft === 0,
        pingCooldownLeft,
        breedCooldownLeft,
        expectedReward: Number(formatEther(expectedRewardWei)).toFixed(2),
        pendingPeriods,
        pendingCRAA,
        rarityBonusPct: bonus,
        burnLockedAmount: burn
          ? (Number(burn.lockedAmount) / 1e18).toFixed(2)
          : undefined,
        burnTimeLeft: burn ? burn.timeLeft : undefined,
        canClaim: burn ? burn.canClaim : undefined,
      };

      setNftData(cooldownData);
    } catch {
      setError('Error fetching NFT data');
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

  // Format time accumulation for pending tokens
  const formatTimeAccumulation = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format time until next ping
  const formatTimeUntilPing = (seconds: number): string => {
    if (seconds <= 0) return 'Ready!';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Add function to format CRAA amounts
  const formatCRAA = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString('en-US');
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

  // Auto-refresh every 3 seconds for real-time countdown
  useEffect(() => {
    if (!nftData) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const pingCooldownLeft = Math.max(
        0,
        pingInterval - (now - nftData.lastPingTime)
      );
      const breedCooldownLeft = Math.max(
        0,
        breedCooldown - (now - nftData.lastBreedTime)
      );

      setNftData(prev =>
        prev
          ? {
              ...prev,
              pingCooldownLeft,
              breedCooldownLeft,
              canPing: pingCooldownLeft === 0,
              canBreed: breedCooldownLeft === 0,
            }
          : null
      );
    }, 3000); // Changed from 1000 to 3000 (3 seconds)

    return () => clearInterval(interval);
  }, [nftData, pingInterval, breedCooldown]);

  return (
    <Card className='w-full p-4 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-bold text-white flex items-center'>
          <Clock className='h-5 w-5 mr-2 text-blue-400' />
          {t('info.nftInspector', 'NFT Cooldown Inspector')}
          {/* Live indicator */}
          <div className='flex items-center ml-2'>
            <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse'></div>
            <span className='text-xs text-green-300 ml-1'>
              {t('sections.ping.live', 'Live')}
            </span>
          </div>
        </h3>
      </div>

      {/* Search Input */}
      <div className='flex gap-2 mb-4'>
        <Input
          type='number'
          placeholder='Enter any NFT ID (1-5000)'
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
            {isConnected
              ? t(
                  'info.inspectorReady',
                  'NFT Inspector ready - enter any NFT ID to view stats'
                )
              : t(
                  'info.inspectorNoWallet',
                  'NFT Inspector works without wallet connection - enter any NFT ID to view public stats'
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
                  {nftData.currentStars}/{nftData.initialStars}
                </span>
              </div>
              <div className='flex space-x-1'>
                {Array.from({ length: nftData.initialStars }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < nftData.currentStars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                  />
                ))}
              </div>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-2'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-slate-400 text-xs'>
                  {t('info.status', 'Status')}
                </span>
                {nftData.isInGraveyard ? (
                  <Skull className='h-3 w-3 text-red-400' />
                ) : (
                  <Zap className='h-3 w-3 text-green-400' />
                )}
              </div>
              <p
                className={`text-base font-bold ${nftData.isInGraveyard ? 'text-red-400' : 'text-green-400'}`}
              >
                {nftData.isInGraveyard
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
                {formatCRAA(nftData.lockedCRAA)}
              </p>
            </div>
          </div>

          {/* Ping Analytics */}
          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div className='bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/30'>
              <h4 className='text-sm font-semibold text-cyan-300 mb-1 flex items-center'>
                <Zap className='h-4 w-4 mr-1' />
                Pending CRAA
              </h4>
              <p className='text-lg font-mono text-white text-center'>
                {formatCRAA(nftData.pendingCRAA)} CRAA
              </p>
              {/* Time accumulation info */}
              {nftData.isActivated && (
                <div className='text-xs text-cyan-200 text-center mt-1'>
                  ⏰ {t('sections.ping.accumulated', 'Accumulated')}:{' '}
                  {formatTimeAccumulation(nowSec - nftData.lastPingTime)}
                </div>
              )}
            </div>
            <div className='bg-purple-900/20 rounded-lg p-4 border border-purple-500/30'>
              <h4 className='text-sm font-semibold text-purple-300 mb-1 flex items-center'>
                <Timer className='h-4 w-4 mr-1' />
                Periods
              </h4>
              <p className='text-lg font-mono text-white text-center'>
                {nftData.pendingPeriods}
              </p>
            </div>
          </div>

          {/* Cooldown Information */}
          {!nftData.isInGraveyard && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-blue-900/20 rounded-lg p-4 border border-blue-500/30'>
                <div className='flex items-center justify-between mb-1'>
                  <h4 className='text-sm font-semibold text-blue-300 flex items-center'>
                    <Zap className='h-4 w-4 mr-1' />
                    {t('ping.title', 'Ping')}
                  </h4>
                  <Badge
                    variant={nftData.canPing ? 'default' : 'secondary'}
                    className='h-5 text-xs px-1.5'
                  >
                    {nftData.canPing
                      ? t('status.ready', 'Ready')
                      : t('status.waiting', 'Waiting')}
                  </Badge>
                </div>
                <p className='text-lg font-mono text-white text-center'>
                  {formatTime(nftData.pingCooldownLeft)}
                </p>
                {/* Time until next ping */}
                {!nftData.canPing && (
                  <div className='text-xs text-blue-200 text-center mt-1'>
                    ⏳ {t('sections.ping.nextPing', 'Next Ping')}:{' '}
                    {formatTimeUntilPing(nftData.pingCooldownLeft)}
                  </div>
                )}
              </div>

              <div className='bg-green-900/20 rounded-lg p-4 border border-green-500/30'>
                <div className='flex items-center justify-between mb-1'>
                  <h4 className='text-sm font-semibold text-green-300 flex items-center'>
                    <Heart className='h-4 w-4 mr-1' />
                    {t('breed.title', 'Breed')}
                  </h4>
                  <Badge
                    variant={nftData.canBreed ? 'default' : 'secondary'}
                    className='h-5 text-xs px-1.5'
                  >
                    {nftData.canBreed
                      ? t('status.ready', 'Ready')
                      : t('status.waiting', 'Waiting')}
                  </Badge>
                </div>
                <p className='text-lg font-mono text-white text-center'>
                  {formatTime(nftData.breedCooldownLeft)}
                </p>
              </div>
            </div>
          )}

          {/* Graveyard & Burn Info */}
          {nftData.isInGraveyard && (
            <div className='bg-red-900/20 rounded-lg p-4 border border-red-500/30'>
              <div className='flex items-center justify-between mb-1'>
                <h4 className='text-sm font-semibold text-red-300 flex items-center'>
                  <Skull className='h-4 w-4 mr-1' />
                  {t('graveyard.title', 'Graveyard')}
                </h4>
                {nftData.burnLockedAmount && (
                  <Badge
                    variant={nftData.canClaim ? 'default' : 'secondary'}
                    className='h-5 text-xs px-1.5'
                  >
                    {nftData.canClaim
                      ? t('status.claimable', 'Claimable')
                      : t('status.locked', 'Locked')}
                  </Badge>
                )}
              </div>
              {nftData.burnLockedAmount && (
                <div className='text-xs text-slate-300 space-y-1'>
                  <div className='flex justify-between'>
                    <span>{t('info.locked', 'Locked')}:</span>{' '}
                    <span className='font-mono'>
                      {formatCRAA(nftData.burnLockedAmount)} CRAA
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{t('info.timeLeft', 'Time left')}:</span>{' '}
                    <span
                      className={`font-mono ${nftData.canClaim ? 'text-green-400' : 'text-orange-400'}`}
                    >
                      {formatTime(nftData.burnTimeLeft || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
