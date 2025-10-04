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
  Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCrazyOctagonGame } from '@/hooks/useCrazyOctagonGame';
import { useNFTGameInfo } from '@/hooks/useNFTGameData';
import { useTranslation } from 'react-i18next';
import { createPublicClient, http, formatEther } from 'viem';
import { monadChain } from '@/config/chains';
import { CRAZY_OCTAGON_READER_ABI } from '@/lib/abi/crazyOctagon';

interface NFTCooldownData {
  tokenId: string;
  rarity: number;
  initialStars: number;
  currentStars: number;
  isActivated: boolean;
  isInGraveyard: boolean;
  lockedOcta: string;
  lastPingTime: number;
  lastBreedTime: number;
  canPing: boolean;
  canBreed: boolean;
  pingCooldownLeft: number;
  breedCooldownLeft: number;
  expectedReward: string;
  pendingPeriods: number;
  pendingOCTAA: string;
  rarityBonusPct: number;
  burnLockedAmount?: string | undefined;
  burnTimeLeft?: number | undefined;
  canClaim?: boolean | undefined;
  gender: number; // 1 = boy, 2 = girl
  bonusStars: number; // Add bonus stars field
}

interface LPInfo {
  lpAmount: string;
  octaDeposited: string;
  pairDeposited: string;
}

export default function NFTCooldownInspector() {
  const { t } = useTranslation();
  const [tokenId, setTokenId] = useState('');
  const [nftData, setNftData] = useState<NFTCooldownData | null>(null);
  const [lpInfo, setLpInfo] = useState<LPInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));
  const [inspectedTokenId, setInspectedTokenId] = useState<string | undefined>(undefined);

  const { getNFTGameData, pingInterval, breedCooldown, isConnected } =
    useCrazyOctagonGame();
  
  // Используем хук для получения РЕАЛЬНОГО breedCooldown из контракта (с breedUnlockAt)
  const { nftInfo: realTimeNftInfo } = useNFTGameInfo(inspectedTokenId);

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
      setNftData(null);
      setLpInfo(null);
      
      // Устанавливаем tokenId для хука, чтобы он начал читать breedUnlockAt
      setInspectedTokenId(tokenId);

      // Step 1: Fetch core data from the hook
      const gameData = await getNFTGameData(tokenId);

      if (!gameData) {
        setError(
          'NFT not found. It might not exist or has not been activated in the game yet.'
        );
        setLoading(false);
        return;
      }

      const client = createPublicClient({ chain: monadChain, transport: http() });
      const READER_ADDRESS = monadChain.contracts.reader?.address as `0x${string}`;

      // Step 2: Fetch LP Info
      const lpData = (await client.readContract({
        address: READER_ADDRESS,
        abi: CRAZY_OCTAGON_READER_ABI,
        functionName: 'getLPInfo',
        args: [BigInt(tokenId)],
      })) as readonly [unknown, unknown, bigint, bigint, bigint];

      setLpInfo({
        lpAmount: formatEther(lpData[2]),
        octaDeposited: formatEther(lpData[3]),
        pairDeposited: formatEther(lpData[4]),
      });

      // For now, we will just display the direct data from the hook
      // We can add complex reward calculations in the next step.
      const now = Math.floor(Date.now() / 1000);
      const pingCooldownLeft = Math.max(
        0,
        pingInterval - (now - gameData.lastPingTime)
      );
      
      // Используем РЕАЛЬНЫЙ breedCooldown из хука (с учётом breedUnlockAt)
      const breedCooldownLeft = realTimeNftInfo?.breedCooldown ?? Math.max(
        0,
        breedCooldown - (now - gameData.lastBreedTime)
      );

      const simplifiedData: NFTCooldownData = {
        tokenId: gameData.tokenId,
        rarity: gameData.rarity,
        initialStars: gameData.initialStars,
        currentStars: gameData.currentStars,
        isActivated: gameData.isActivated,
        isInGraveyard: gameData.isInGraveyard,
        lockedOcta: gameData.lockedOcta,
        lastPingTime: gameData.lastPingTime,
        lastBreedTime: gameData.lastBreedTime,
        canPing: pingCooldownLeft === 0,
        canBreed: breedCooldownLeft === 0,
        pingCooldownLeft,
        breedCooldownLeft,
        // Placeholder values for data we will calculate next
        expectedReward: '0',
        pendingPeriods: 0,
        pendingOCTAA: '0',
        rarityBonusPct: 0,
        gender: gameData.gender ?? ((Number(gameData.tokenId) % 2) + 1), // 1 = boy, 2 = girl
        bonusStars: gameData.bonusStars ?? 0,
      };

      setNftData(simplifiedData);
    } catch (err: unknown) {
      console.error('Error fetching NFT data:', err);
      const errorDetails =
        err instanceof Error
          ? `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ''}`
          : JSON.stringify(err);
      setError(
        `RAW ERROR: ${errorDetails}. Please send this full text for debugging.`
      );
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

  // Gender display functions
  const getGenderIcon = (gender: number) => {
    return gender === 1 ? '♂️' : '♀️'; // 1 = boy, 2 = girl
  };

  const getGenderText = (gender: number) => {
    return gender === 1 ? 'Boy' : 'Girl';
  };

  const formatSmallNumber = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num === 0) return '0.00';
    if (num > 0 && num < 0.0001) {
      return num.toFixed(18).replace(/\.?0+$/, '');
    }
    return num.toFixed(4);
  };

  // Add function to format OCTAA amounts
  const formatOCTAA = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(4);
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
      
      // Используем РЕАЛЬНЫЙ breedCooldown из хука (с breedUnlockAt)
      const breedCooldownLeft = realTimeNftInfo?.breedCooldown ?? Math.max(
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
  }, [nftData, pingInterval, breedCooldown, realTimeNftInfo]);

  return (
    <Card className='w-full p-3 bg-slate-800/50 backdrop-blur-sm border-4 border-yellow-400/80 shadow-2xl shadow-yellow-400/40 ring-2 ring-yellow-300/30'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-base font-bold text-white flex items-center'>
          <Clock className='h-4 w-4 mr-2 text-pink-400' />
          {t('info.nftInspector', 'NFT Cooldown Inspector 1')}
          {/* Live indicator */}
          <div className='flex items-center ml-2'>
            <div className='w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse'></div>
            <span className='text-xs text-pink-300 ml-1'>
              {t('sections.ping.live', 'Live')}
            </span>
          </div>
        </h3>
      </div>

      {/* Search Input */}
      <div className='flex gap-2 mb-3'>
        <Input
          type='number'
          placeholder='Enter any NFT ID (1-9700)'
          value={tokenId}
          onChange={e => setTokenId(e.target.value)}
          className='bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 h-8 text-sm'
          onKeyPress={e => e.key === 'Enter' && inspectNFT()}
        />
        <Button
          onClick={inspectNFT}
          disabled={loading || !tokenId.trim()}
          className='bg-pink-600 hover:bg-pink-700 h-8 px-3'
        >
          {loading ? (
            <RefreshCw className='h-3 w-3 animate-spin' />
          ) : (
            <Search className='h-3 w-3' />
          )}
        </Button>
      </div>

      {/* Info Message */}
      <div className='bg-pink-900/20 border border-pink-500/30 rounded-lg p-2 mb-3 text-xs'>
        <div className='flex items-center'>
          <Info className='h-4 w-4 text-pink-400 mr-2' />
          <span className='text-pink-300'>
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
        <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-2 mb-3'>
          <p className='text-red-300 text-xs'>{error}</p>
        </div>
      )}

      {/* NFT Data Display */}
      {nftData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-2'
        >
          {/* Basic Info */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5'>
            <div className='bg-slate-900/50 rounded-lg p-1.5'>
              <div className='flex items-center justify-between mb-0.5'>
                <span className='text-slate-400 text-xs'>NFT ID</span>
              </div>
              <p className='text-sm font-bold text-white'>#{nftData.tokenId}</p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-1.5'>
              <div className='flex items-center justify-between mb-0.5'>
                <span className='text-slate-400 text-xs'>
                  {t('info.rarity', 'Rarity')}
                </span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${getRarityColor(
                    nftData.rarity
                  )}`}
                ></div>
              </div>
              <p className='text-xs font-bold text-white'>
                {getRarityName(nftData.rarity)}
              </p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-1.5'>
              <div className='flex items-center justify-between mb-0.5'>
                <span className='text-slate-400 text-xs'>
                  {t('info.stars', 'Stars')}
                </span>
                <span className='text-yellow-400 font-bold text-xs'>
                  {nftData.currentStars}/{nftData.initialStars}
                </span>
              </div>
              <div className='flex space-x-1'>
                {Array.from({ length: nftData.initialStars }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < nftData.currentStars
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-600'
                      }`}
                  />
                ))}
              </div>
              {nftData.bonusStars > 0 && (
                <div className='flex items-center justify-between mb-0.5 mt-1'>
                  <span className='text-slate-400 text-xs'>
                    {t('info.bonusStars', 'Bonus Stars')}
                  </span>
                  <span className='text-yellow-400 font-bold text-xs'>
                    {nftData.bonusStars}
                  </span>
                </div>
              )}
            </div>

            <div className='bg-slate-900/50 rounded-lg p-1.5'>
              <div className='flex items-center justify-between mb-0.5'>
                <span className='text-slate-400 text-xs'>
                  {t('info.status', 'Status')}
                </span>
                {nftData.isInGraveyard ? (
                  <Skull className='h-2.5 w-2.5 text-red-400' />
                ) : (
                  <Zap className='h-2.5 w-2.5 text-green-400' />
                )}
              </div>
              <p
                className={`text-xs font-bold ${nftData.isInGraveyard ? 'text-red-400' : 'text-green-400'
                  }`}
              >
                {nftData.isInGraveyard
                  ? t('info.graveyard', 'Graveyard')
                  : t('info.active', 'Active')}
              </p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-1.5'>
              <div className='flex items-center justify-between mb-0.5'>
                <span className='text-slate-400 text-xs'>
                  {t('info.lockedCra', 'Locked OCTAA')}
                </span>
              </div>
              <p className='text-xs font-bold text-white'>
                {formatOCTAA(nftData.lockedOcta)}
              </p>
            </div>

            <div className='bg-slate-900/50 rounded-lg p-1.5'>
              <div className='flex items-center justify-between mb-0.5'>
                <span className='text-slate-400 text-xs'>Gender</span>
                <span className='text-sm'>
                  {getGenderIcon(nftData.gender)}
                </span>
              </div>
              <p className='text-xs font-bold text-white'>
                {getGenderText(nftData.gender)}
              </p>
            </div>
          </div>

          {/* LP Info Card */}
          {lpInfo && (
            <Card className='bg-pink-900/20 rounded-lg p-2 border border-pink-500/30'>
              <h4 className='text-xs font-semibold text-pink-300 mb-1 flex items-center'>
                <Layers className='h-3 w-3 mr-1' />
                LP Details
              </h4>
              <div className='text-xs text-slate-300 space-y-0.5'>
                <div className='flex justify-between'>
                  <span>LP Tokens:</span>
                  <span className='font-mono text-white'>{formatSmallNumber(lpInfo.lpAmount)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>OCTAA Deposited:</span>
                  <span className='font-mono text-white'>{formatSmallNumber(lpInfo.octaDeposited)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>{monadChain.nativeCurrency.symbol} Deposited:</span>
                  <span className='font-mono text-white'>{formatSmallNumber(lpInfo.pairDeposited)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Ping Analytics */}
          <div className='grid grid-cols-2 gap-2 mb-2'>
            <div className='bg-pink-900/20 rounded-lg p-2 border border-pink-500/30'>
              <h4 className='text-xs font-semibold text-pink-300 mb-0.5 flex items-center'>
                <Zap className='h-3 w-3 mr-1' />
                Pending OCTAA
              </h4>
              <p className='text-sm font-mono text-white text-center'>
                {formatOCTAA(nftData.pendingOCTAA)} OCTAA
              </p>
              {/* Time accumulation info */}
              {nftData.isActivated && (
                <div className='text-xs text-pink-200 text-center mt-0.5'>
                  ⏰ {t('sections.ping.accumulated', 'Accumulated')}:{' '}
                  {formatTimeAccumulation(nowSec - nftData.lastPingTime)}
                </div>
              )}
            </div>
            <div className='bg-purple-900/20 rounded-lg p-2 border border-purple-500/30'>
              <h4 className='text-xs font-semibold text-purple-300 mb-0.5 flex items-center'>
                <Timer className='h-3 w-3 mr-1' />
                Periods
              </h4>
              <p className='text-sm font-mono text-white text-center'>
                {nftData.pendingPeriods}
              </p>
            </div>
          </div>

          {/* Cooldown Information */}
          {!nftData.isInGraveyard && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <div className='bg-blue-900/20 rounded-lg p-2 border border-blue-500/30'>
                <div className='flex items-center justify-between mb-0.5'>
                  <h4 className='text-xs font-semibold text-blue-300 flex items-center'>
                    <Zap className='h-3 w-3 mr-1' />
                    {t('ping.title', 'Ping')}
                  </h4>
                  <Badge
                    variant={nftData.canPing ? 'default' : 'secondary'}
                    className='h-4 text-xs px-1'
                  >
                    {nftData.canPing
                      ? t('status.ready', 'Ready')
                      : t('status.waiting', 'Waiting')}
                  </Badge>
                </div>
                <p className='text-sm font-mono text-white text-center'>
                  {formatTime(nftData.pingCooldownLeft)}
                </p>
                {/* Time until next ping */}
                {!nftData.canPing && (
                  <div className='text-xs text-blue-200 text-center mt-0.5'>
                    ⏳ {t('sections.ping.nextPing', 'Next Ping')}:{' '}
                    {formatTimeUntilPing(nftData.pingCooldownLeft)}
                  </div>
                )}
              </div>

              <div className='bg-green-900/20 rounded-lg p-2 border border-green-500/30'>
                <div className='flex items-center justify-between mb-0.5'>
                  <h4 className='text-xs font-semibold text-green-300 flex items-center'>
                    <Heart className='h-3 w-3 mr-1' />
                    {t('breed.title', 'Breed')}
                  </h4>
                  <Badge
                    variant={nftData.canBreed ? 'default' : 'secondary'}
                    className='h-4 text-xs px-1'
                  >
                    {nftData.canBreed
                      ? t('status.ready', 'Ready')
                      : t('status.waiting', 'Waiting')}
                  </Badge>
                </div>
                <p className={`text-sm font-mono text-center ${nftData.canBreed ? 'text-green-300' : 'text-amber-300'}`}>
                  {nftData.canBreed ? '✅ 0s' : `⏳ ${formatTime(nftData.breedCooldownLeft)}`}
                </p>
                {!nftData.canBreed && (
                  <div className='text-xs text-amber-200 text-center mt-0.5'>
                    🔒 {t('sections.breed.breedingCooldown', 'Breeding cooldown active')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Graveyard & Burn Info */}
          {nftData.isInGraveyard && (
            <div className='bg-red-900/20 rounded-lg p-2 border border-red-500/30'>
              <div className='flex items-center justify-between mb-0.5'>
                <h4 className='text-xs font-semibold text-red-300 flex items-center'>
                  <Skull className='h-3 w-3 mr-1' />
                  {t('graveyard.title', 'Graveyard')}
                </h4>
                {nftData.burnLockedAmount && (
                  <Badge
                    variant={nftData.canClaim ? 'default' : 'secondary'}
                    className='h-4 text-xs px-1'
                  >
                    {nftData.canClaim
                      ? t('status.claimable', 'Claimable')
                      : t('status.locked', 'Locked')}
                  </Badge>
                )}
              </div>
              {nftData.burnLockedAmount && (
                <div className='text-xs text-slate-300 space-y-0.5'>
                  <div className='flex justify-between'>
                    <span>{t('info.locked', 'Locked')}:</span>{' '}
                    <span className='font-mono'>
                      {formatOCTAA(nftData.burnLockedAmount)} OCTAA
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
        <div className='text-center py-4'>
          <Timer className='h-6 w-6 text-slate-500 mx-auto mb-1' />
          <p className='text-slate-400 text-xs'>
            {t('info.enterNftId', 'Enter NFT ID to inspect')}
          </p>
        </div>
      )}
    </Card>
  );
}
