'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Gem,
  ShoppingCart,
  ExternalLink,
  Coins,
  Activity,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MarketData {
  floorApe: number;
  craUsd: number;
  apeUsd: number;
  floorCra: number;
  floorUsd: number;
  error?: string;
}

interface CRATokenData {
  price_usd: number;
  price_ape: number;
  price_change_24h: number;
  price_change_1h: number;
  volume_24h: number;
  market_cap: number;
}

const MarketPrices = () => {
  const { t } = useTranslation();

  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [craData, setCraData] = useState<CRATokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market prices
      const marketResponse = await fetch('/api/market/prices', {
        next: { revalidate: 180 },
      });

      if (!marketResponse.ok) {
        throw new Error(
          `HTTP ${marketResponse.status}: ${marketResponse.statusText}`
        );
      }

      const marketResult = await marketResponse.json();
      if (marketResult.error) {
        // Use fallback data if available
        if (
          marketResult.floorApe ||
          marketResult.craUsd ||
          marketResult.apeUsd
        ) {
          setMarketData(marketResult);
        } else {
          throw new Error(marketResult.error);
        }
      } else {
        setMarketData(marketResult);
      }

      // Try to fetch CRA token data
      try {
        const craaResponse = await fetch('/api/craa-token');
        if (craaResponse.ok) {
          const craResult = await craaResponse.json();
          if (craResult.success && craResult.data) {
            setCraData(craResult.data);
          }
        }
      } catch (craError) {
        // CRA data is optional, don't fail the whole component
      }

      setLastUpdate(new Date());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`${t('market.failed')}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 180000); // Update every 3 minutes
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (
    price: number | null | undefined,
    decimals: number = 8
  ) => {
    if (price === null || price === undefined || isNaN(price)) return 'N/A';
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toFixed(decimals);
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className='h-3 w-3' />;
    if (change < 0) return <ArrowDownRight className='h-3 w-3' />;
    return null;
  };

  if (loading && !marketData) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400'></div>
          <span className='ml-3 text-slate-300'>{t('market.loading')}</span>
        </div>
      </Card>
    );
  }

  if (error && !marketData) {
    return (
      <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
        <div className='text-center'>
          <DollarSign className='h-12 w-12 mx-auto mb-4 text-red-400' />
          <p className='text-red-400 mb-4'>{error}</p>
          <Button
            onClick={fetchMarketData}
            variant='outline'
            className='border-red-500/30 text-red-400 hover:bg-red-900/20'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            {t('common.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  if (!marketData) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 backdrop-blur-sm border-emerald-500/30'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center'>
              <DollarSign className='h-6 w-6 mr-2 text-emerald-400' />
              {t('market.header')}
            </h2>
            <p className='text-emerald-300 mt-1'>{t('market.subtitle')}</p>
          </div>
          <div className='flex items-center space-x-4'>
            <Button
              onClick={fetchMarketData}
              variant='outline'
              size='sm'
              disabled={loading}
              className='border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/20'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <div className='flex items-center space-x-2'>
              <div
                className={`h-2 w-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}
              ></div>
              <div className='text-right'>
                <p
                  className={`text-sm ${error ? 'text-red-400' : 'text-green-400'}`}
                >
                  {error ? t('market.error') : t('market.live')}
                </p>
                <p className='text-slate-400 text-xs'>
                  {lastUpdate.toLocaleTimeString(
                    i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Price Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* NFT Floor Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Gem className='h-8 w-8 text-purple-400 mr-3' />
                <div>
                  <h3 className='text-lg font-bold text-white'>NFT Floor</h3>
                  <p className='text-purple-300 text-sm'>
                    {t('market.floorPrice')}
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>APE:</span>
                <span className='text-2xl font-bold text-purple-400'>
                  {formatPrice(marketData.floorApe, 2)} APE
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>USD:</span>
                <span className='text-xl font-semibold text-white'>
                  ${formatPrice(marketData.floorUsd, 2)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>CRA:</span>
                <span className='text-lg font-semibold text-purple-300'>
                  {formatPrice(marketData.floorCra, 0)} CRA
                </span>
              </div>
            </div>

            {/* NFT Marketplace Link */}
            <div className='mt-4 pt-4 border-t border-purple-500/20'>
              <a
                href='https://magiceden.us/collections/apechain/crazycube-2'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-300 transform hover:scale-105'
              >
                <ShoppingCart className='h-5 w-5 mr-2 text-white' />
                <span className='text-white font-bold text-base'>
                  {t('market.buyNft')}
                </span>
                <ExternalLink className='h-4 w-4 ml-2 text-white' />
              </a>
            </div>
          </Card>
        </motion.div>

        {/* CRA Token */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='p-6 bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Coins className='h-8 w-8 text-orange-400 mr-3' />
                <div>
                  <h3 className='text-lg font-bold text-white'>CRA Token</h3>
                  <p className='text-orange-300 text-sm'>
                    {t('market.gameToken')}
                  </p>
                </div>
              </div>
              {craData && (
                <Badge
                  variant='outline'
                  className={`${getPriceChangeColor(craData.price_change_24h)} border-current`}
                >
                  <div className='flex items-center'>
                    {getPriceChangeIcon(craData.price_change_24h)}
                    <span className='ml-1'>
                      {craData.price_change_24h > 0 ? '+' : ''}
                      {craData.price_change_24h.toFixed(2)}%
                    </span>
                  </div>
                </Badge>
              )}
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>USD:</span>
                <span className='text-2xl font-bold text-orange-400'>
                  $
                  {formatPrice(
                    craData ? craData.price_usd : marketData.craUsd,
                    10
                  )}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>APE:</span>
                <span className='text-xl font-semibold text-white'>
                  {craData
                    ? formatPrice(craData.price_ape, 8)
                    : formatPrice(
                        marketData.craUsd / marketData.apeUsd,
                        8
                      )}{' '}
                  APE
                </span>
              </div>
              {craData && (
                <div className='flex justify-between items-center'>
                  <span className='text-slate-400'>Market Cap:</span>
                  <span className='text-lg font-semibold text-green-400'>
                    {formatCurrency(craData.market_cap)}
                  </span>
                </div>
              )}
            </div>

            {/* DEX Trading Link */}
            <div className='mt-4 pt-4 border-t border-orange-500/20'>
              <a
                href='https://app.camelot.exchange/'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg transition-all duration-300 transform hover:scale-105'
              >
                <TrendingUp className='h-5 w-5 mr-2 text-white' />
                <span className='text-white font-bold text-base'>
                  {t('market.tradeDex')}
                </span>
                <ExternalLink className='h-4 w-4 ml-2 text-white' />
              </a>
            </div>
          </Card>
        </motion.div>

        {/* APE Token */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className='p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Activity className='h-8 w-8 text-blue-400 mr-3' />
                <div>
                  <h3 className='text-lg font-bold text-white'>APE Token</h3>
                  <p className='text-blue-300 text-sm'>
                    {t('market.baseCurrency')}
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>USD:</span>
                <span className='text-2xl font-bold text-blue-400'>
                  ${formatPrice(marketData.apeUsd, 2)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-slate-400'>CRA Rate:</span>
                <span className='text-xl font-semibold text-white'>
                  1 APE ={' '}
                  {formatPrice(marketData.apeUsd / marketData.craUsd, 0)} CRA
                </span>
              </div>
              {craData && (
                <div className='flex justify-between items-center'>
                  <span className='text-slate-400'>Volume 24h:</span>
                  <span className='text-lg font-semibold text-green-400'>
                    {formatCurrency(craData.volume_24h)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Additional Info */}
      {craData && (
        <Card className='p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700'>
          <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
            <TrendingUp className='h-5 w-5 mr-2 text-green-400' />
            {t('market.additional')}
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='text-center'>
              <p className='text-slate-400 text-sm'>{t('market.change1h')}</p>
              <p
                className={`text-xl font-bold ${getPriceChangeColor(craData.price_change_1h)}`}
              >
                {craData.price_change_1h > 0 ? '+' : ''}
                {craData.price_change_1h.toFixed(2)}%
              </p>
            </div>

            <div className='text-center'>
              <p className='text-slate-400 text-sm'>{t('market.change24h')}</p>
              <p
                className={`text-xl font-bold ${getPriceChangeColor(craData.price_change_24h)}`}
              >
                {craData.price_change_24h > 0 ? '+' : ''}
                {craData.price_change_24h.toFixed(2)}%
              </p>
            </div>

            <div className='text-center'>
              <p className='text-slate-400 text-sm'>{t('market.volume24h')}</p>
              <p className='text-xl font-bold text-blue-400'>
                {formatCurrency(craData.volume_24h)}
              </p>
            </div>

            <div className='text-center'>
              <p className='text-slate-400 text-sm'>{t('market.marketCap')}</p>
              <p className='text-xl font-bold text-purple-400'>
                {formatCurrency(craData.market_cap)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
