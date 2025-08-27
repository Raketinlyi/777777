'use client';

import { createPublicClient, http } from 'viem';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  Flame,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

// CRAA Token API
const CRAA_API = '/api/craa-token';
const CRAA_TOKEN_ADDRESS = '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5';

// Public Viem client (read-only)
const publicClient = createPublicClient({
  transport: http('https://rpc.apechain.com'),
});

// ERC20 totalSupply ABI fragment
const ERC20_ABI = [
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
];

// Keys used in localStorage cache
const BURN_CACHE_KEY = 'craa_burned_cache'; // amount burned (wei) + ts
const INITIAL_SUPPLY_KEY = 'cra_initial_supply'; // cached initial totalSupply (wei)
// TTL 4 hours
const BURN_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

// Subgraph URL
const SUBGRAPH_URL = '/api/subgraph-token';

interface CRATokenData {
  // Basic data
  totalSupply: string;
  circulatingSupply: string;
  burnedAmount: string;
  lockedInGame: string;

  // Prices
  priceUSD: number;
  priceAPE: number;
  marketCap: number;
  volume24h: number;

  // 24h changes
  priceChange24h: number;
  volumeChange24h: number;

  // Game stats
  totalBurns: number;
  totalClaimed: number;
  avgBurnAmount: number;

  // Metadata
  lastUpdated: string;
}

export default function CRATokenInfo() {
  const [tokenData, setTokenData] = useState<CRATokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    priceData: unknown;
    subgraphData: unknown;
    tokenStats: unknown;
    recentBurns: unknown[];
  } | null>(null);

  // Load CRAA token data
  useEffect(() => {
    fetchCRAData();
  }, []);

  const fetchCRAData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request price data from GeckoTerminal API
      let priceData = null;
      try {
        const priceRes = await fetch(CRAA_API);
        const priceResult = await priceRes.json();

        if (priceResult.success) {
          priceData = priceResult.data;
        } else {
        }
        // DexScreener fallback if GeckoTerminal failed or returned null
        if (!priceData) {
          try {
            const dsRes = await fetch(
              'https://api.dexscreener.com/latest/dex/pairs/apechain/0xab6242f2fbb14caefe9447126704a17947842c6f'
            );
            const dsJson = await dsRes.json();
            if (dsJson?.pair) {
              const p = dsJson.pair;
              priceData = {
                priceUsd: parseFloat(p.priceUsd ?? '0'),
                priceAPE: parseFloat(p.priceNative ?? '0'),
                marketCap: parseFloat(p.fdvUsd ?? p.marketCapUsd ?? '0'),
                volume24h: parseFloat(p.volume?.h24 ?? '0'),
                priceChange24h: parseFloat(p.priceChange?.h24 ?? '0'),
                volumeChange24h: 0,
              } as any;
            }
          } catch (dsErr: unknown) {
          const errorMessage = dsErr instanceof Error ? dsErr.message : 'Unknown error';
          console.error('DexScreener error:', errorMessage);
        }
        }
              } catch (priceError: unknown) {
          const errorMessage = priceError instanceof Error ? priceError.message : 'Unknown error';
          console.error('Price error:', errorMessage);
        }

      // 2. Query subgraph for game data
      let subgraphData = null;
      try {
        const tokenQuery = `{
          tokenStat(id: "craa") {
            totalSupply
            circulating
            burned
            treasury
            dexLiquidity
            airdrop
            rewards
          }
          burnEvents(first: 100, orderBy: timestamp, orderDirection: desc) {
            amount
            timestamp
          }
        }`;

        const subgraphRes = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: tokenQuery }),
        });

        subgraphData = await subgraphRes.json();
              } catch (subgraphError: unknown) {
          const errorMessage = subgraphError instanceof Error ? subgraphError.message : 'Unknown error';
          console.error('Subgraph error:', errorMessage);
        }

      // 2.2 Get burned CRAA (from cache or on-chain)
      let burnedWei: bigint = 0n;
      try {
        const cachedRaw =
          typeof window !== 'undefined'
            ? localStorage.getItem(BURN_CACHE_KEY)
            : null;
        if (cachedRaw) {
          const cached: { ts: number; value: string } = JSON.parse(cachedRaw);
          if (Date.now() - cached.ts < BURN_CACHE_TTL_MS && cached.value) {
            burnedWei = BigInt(cached.value);
          }
        }
        if (burnedWei === 0n) {
          const totalSupplyWei = (await publicClient.readContract({
            address: CRAA_TOKEN_ADDRESS as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
          })) as bigint;
          // Calculate initialSupplyWei dynamically and cache it
          let initialSupplyWei: bigint;
          const cachedInitRaw =
            typeof window !== 'undefined'
              ? localStorage.getItem(INITIAL_SUPPLY_KEY)
              : null;
          if (cachedInitRaw) {
            initialSupplyWei = BigInt(cachedInitRaw);
            // If totalSupply has increased (mint), update cache
            if (totalSupplyWei > initialSupplyWei) {
              initialSupplyWei = totalSupplyWei;
              if (typeof window !== 'undefined') {
                localStorage.setItem(
                  INITIAL_SUPPLY_KEY,
                  initialSupplyWei.toString()
                );
              }
            }
          } else {
            initialSupplyWei = totalSupplyWei;
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                INITIAL_SUPPLY_KEY,
                initialSupplyWei.toString()
              );
            }
          }

          burnedWei =
            initialSupplyWei > totalSupplyWei
              ? initialSupplyWei - totalSupplyWei
              : 0n;
          if (burnedWei < 0n) burnedWei = 0n;
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              BURN_CACHE_KEY,
              JSON.stringify({ ts: Date.now(), value: burnedWei.toString() })
            );
          }
        }
              } catch (burnErr: unknown) {
          const errorMessage = burnErr instanceof Error ? burnErr.message : 'Unknown error';
          console.error('Burn error:', errorMessage);
        }

      // 3. Process and merge data
      const tokenStats = subgraphData?.data?.tokenStat;
      const recentBurns = subgraphData?.data?.burnEvents || [];

      // Calculate average burn amount
      const avgBurnAmount =
        recentBurns.length > 0
          ? recentBurns.reduce(
              (sum: number, burn: any) => sum + parseFloat(burn.amount || '0'),
              0
            ) / recentBurns.length
          : 0;

      // Build final data object
      const finalData: CRATokenData = {
        // Prices
        priceUSD: parseFloat(
          (priceData?.price_usd ??
            priceData?.priceUsd ??
            priceData?.priceUSD) ||
            '0'
        ),
        priceAPE:
          parseFloat(
            priceData?.price_native ??
              priceData?.priceNative ??
              priceData?.priceAPE ??
              '0'
          ) ||
          parseFloat(priceData?.price_usd ?? priceData?.priceUsd ?? '0') / 1.2, // Approximately APE = $1.2
        marketCap: parseFloat(
          (priceData?.market_cap_usd ??
            priceData?.marketCap ??
            priceData?.marketCapUsd ??
            priceData?.market_cap) ||
            '0'
        ),
        volume24h: parseFloat(
          priceData?.volume_24h_usd ??
            priceData?.volume24h ??
            priceData?.volumeUsd ??
            '0'
        ),

        // Changes
        priceChange24h: parseFloat(
          (priceData?.price_change_24h ??
            priceData?.priceChange24h ??
            priceData?.priceChange24H ??
            priceData?.priceChange?.h24) ||
            '0'
        ),
        volumeChange24h: 0, // TODO: add

        // Supply data
        totalSupply: tokenStats?.totalSupply || '0',
        circulatingSupply: tokenStats?.circulating || '0',
        burnedAmount: burnedWei.toString(),
        lockedInGame: tokenStats?.treasury || '0',

        // Game data
        totalBurns: recentBurns.length,
        totalClaimed: 0,
        avgBurnAmount: avgBurnAmount / 1e18, // Convert from wei

        lastUpdated: new Date().toISOString(),
      };

      setTokenData(finalData);
      setDebugInfo({
        priceData,
        subgraphData,

        tokenStats,
        recentBurns: recentBurns.slice(0, 5), // First 5 for debug
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch CRAA data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCRAData();
  };

  // Helper: format numbers
  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatFull = (num: number) =>
    num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  // Formats USD price with adaptive precision
  const formatCurrency = (num: number, fixed?: number) => {
    if (!isFinite(num)) return '$0';
    const abs = Math.abs(num);
    let decimals = fixed ?? 2;
    if (fixed === undefined) {
      if (abs >= 1) decimals = 2;
      else if (abs >= 0.01) decimals = 4;
      else if (abs >= 0.0001) decimals = 6;
      else decimals = 8;
    } else {
      decimals = fixed;
    }
    return `$${num.toFixed(decimals)}`;
  };

  if (loading) {
    return (
      <Card className='p-6 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30'>
        <div className='space-y-4'>
          <Skeleton className='h-8 w-48' />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className='h-24' />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='p-6 bg-red-900/20 border-red-500/30'>
        <div className='flex items-center gap-3 mb-4'>
          <AlertCircle className='h-6 w-6 text-red-400' />
          <h3 className='text-xl font-bold text-red-300'>
            Error loading CRAA data
          </h3>
        </div>
        <p className='text-red-200 mb-4'>{error}</p>
        <Button
          onClick={handleRefresh}
          variant='outline'
          className='border-red-500/50 text-red-300'
        >
          <RefreshCw className='h-4 w-4 mr-2' />
          Retry
        </Button>
      </Card>
    );
  }

  if (!tokenData) return null;

  const isPositiveChange = tokenData.priceChange24h > 0;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-orange-500/20 rounded-lg'>
              <Coins className='h-6 w-6 text-orange-400' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-white'>CRAA Token</h2>
              <p className='text-slate-300 text-sm'>
                Crazy Adventure Advanced Token
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-orange-500/50 text-orange-300'
            >
              Live Data
            </Badge>
            <Button onClick={handleRefresh} variant='ghost' size='sm'>
              <RefreshCw className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Key metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {/* Price */}
          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <DollarSign className='h-4 w-4 text-green-400' />
              <span className='text-sm text-slate-400'>CRAA Price</span>
            </div>
            <div className='text-xl font-bold text-white'>
              {formatCurrency(tokenData.priceUSD)}
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}
            >
              {isPositiveChange ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              )}
              {Math.abs(tokenData.priceChange24h).toFixed(2)}%
            </div>
          </div>

          {/* Market Cap */}
          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <BarChart3 className='h-4 w-4 text-blue-400' />
              <span className='text-sm text-slate-400'>Market Cap (CRAA)</span>
            </div>
            <div className='text-xl font-bold text-white'>
              {formatCurrency(tokenData.marketCap, 0)}
            </div>
            <div className='text-sm text-slate-400'>
              {formatNumber(tokenData.marketCap, 0)}
            </div>
          </div>

          {/* Volume 24h */}
          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <BarChart3 className='h-4 w-4 text-purple-400' />
              <span className='text-sm text-slate-400'>Volume 24h (CRAA)</span>
            </div>
            <div className='text-xl font-bold text-white'>
              {formatCurrency(tokenData.volume24h, 0)}
            </div>
            <div className='text-sm text-slate-400'>
              {formatNumber(tokenData.volume24h, 0)}
            </div>
          </div>

          {/* Total Burns */}
          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <Flame className='h-4 w-4 text-orange-400' />
              <span className='text-sm text-slate-400'>Total Burns</span>
            </div>
            <div className='text-xl font-bold text-white'>
              {formatNumber(tokenData.totalBurns, 0)}
            </div>
            <div className='text-sm text-slate-400'>
              Avg: {formatNumber(tokenData.avgBurnAmount)} CRAA
            </div>
          </div>
        </div>

        {/* Supply Information */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='text-sm text-slate-400 mb-1'>Total CRAA Supply</div>
            <div className='text-lg font-bold text-white'>
              {formatFull(parseFloat(tokenData.totalSupply) / 1e18)}
            </div>
          </div>

          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='text-sm text-slate-400 mb-1'>Circulating CRAA</div>
            <div className='text-lg font-bold text-white'>
              {formatFull(parseFloat(tokenData.circulatingSupply) / 1e18)}
            </div>
          </div>

          <div className='bg-slate-800/50 p-4 rounded-lg'>
            <div className='text-sm text-slate-400 mb-1'>Burned CRAA</div>
            <div className='text-lg font-bold text-orange-400'>
              {formatFull(Number(BigInt(tokenData.burnedAmount) / 10n ** 18n))}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className='flex flex-wrap gap-2 mt-6'>
          <Button variant='outline' size='sm' asChild>
            <a
              href={`https://www.geckoterminal.com/apechain/pools/0xc9c2f86e542620daf12107d4b6eda37936efb903`}
              target='_blank'
              rel='noopener'
            >
              <ExternalLink className='h-3 w-3 mr-1' />
              GeckoTerminal
            </a>
          </Button>

          <Button variant='outline' size='sm' asChild>
            <a
              href={`https://apechain.celatone.io/address/${CRAA_TOKEN_ADDRESS}`}
              target='_blank'
              rel='noopener'
            >
              <ExternalLink className='h-3 w-3 mr-1' />
              Explorer
            </a>
          </Button>
        </div>
      </Card>

      {/* Debug Info */}
      {debugInfo && (
        <Card className='p-4 bg-slate-900/50 border-slate-700'>
          <details>
            <summary className='text-sm text-slate-400 cursor-pointer hover:text-slate-300'>
              🔧 Debug Information
            </summary>
            <pre className='mt-3 text-xs text-slate-400 overflow-auto max-h-60 p-3 bg-slate-900/50 rounded'>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}
