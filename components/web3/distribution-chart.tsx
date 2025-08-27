'use client';

import { useState, useEffect } from 'react';
import { ChartCard } from './chart-card';
import { PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Base URL for Subgraph requests
const SUBGRAPH_URL = '/api/subgraph';

interface RarityDistribution {
  rarity: number;
  count: number;
  inGraveyard: number;
  active: number;
  color: string;
}

export function DistributionChart() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RarityDistribution[]>([]);
  const [viewMode, setViewMode] = useState<'rarity' | 'status'>('rarity');

  // Colors for different rarities
  const rarityColors = [
    '#6366f1', // indigo (rarity 1)
    '#8b5cf6', // violet (rarity 2)
    '#ec4899', // pink (rarity 3)
    '#f43f5e', // red (rarity 4)
    '#f59e0b', // amber (rarity 5)
    '#10b981', // emerald (rarity 6)
  ];

  // Function to request data from Subgraph
  async function fetchDistributionData(): Promise<void> {
    try {
      // Request to Subgraph
      const query = `{
        globalStats(id: "1") {
          totalActiveNFTs
          totalInGraveyard
        }
        rarityStats: nfts(first: 1000) {
          rarity
          isInGraveyard
        }
      }`;

      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();

      // If Subgraph is not configured yet, use test data
      if (!data) {
        setData(generateMockData());
        return;
      }

      // Group NFTs by rarity
      const distribution = processRarityData(data.rarityStats || []);

      setData(distribution);
    } catch (error) {
      // Use test data on error
      setData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  }

  // Processing rarity data
  function processRarityData(
    nfts: { rarity: number; isInGraveyard: boolean }[]
  ): RarityDistribution[] {
    // If no data, return test data
    if (nfts.length === 0) {
      return generateMockData();
    }

    // Group by rarity
    const rarityGroups: Record<number, { total: number; inGraveyard: number }> =
      {};

    nfts.forEach(nft => {
      const rarity = nft.rarity || 0;
      if (!rarityGroups[rarity]) {
        rarityGroups[rarity] = { total: 0, inGraveyard: 0 };
      }

      rarityGroups[rarity].total += 1;
      if (nft.isInGraveyard) {
        rarityGroups[rarity].inGraveyard += 1;
      }
    });

    // Convert to array for display
    return Object.entries(rarityGroups)
      .filter(([rarity]) => rarity !== '0') // Ignore rarity 0
      .map(([rarity, stats]) => ({
        rarity: parseInt(rarity),
        count: stats.total,
        inGraveyard: stats.inGraveyard,
        active: stats.total - stats.inGraveyard,
        color:
          rarityColors[parseInt(rarity) - 1] || rarityColors[0] || '#6366f1',
      }))
      .sort((a, b) => a.rarity - b.rarity);
  }

  // Load data on mount
  useEffect(() => {
    fetchDistributionData();
  }, []);

  // Generate test data
  function generateMockData(): RarityDistribution[] {
    return [
      {
        rarity: 1,
        count: 2000,
        inGraveyard: 400,
        active: 1600,
        color: rarityColors[0] || '#6366f1',
      },
      {
        rarity: 2,
        count: 1500,
        inGraveyard: 300,
        active: 1200,
        color: rarityColors[1] || '#6366f1',
      },
      {
        rarity: 3,
        count: 800,
        inGraveyard: 150,
        active: 650,
        color: rarityColors[2] || '#6366f1',
      },
      {
        rarity: 4,
        count: 400,
        inGraveyard: 80,
        active: 320,
        color: rarityColors[3] || '#6366f1',
      },
      {
        rarity: 5,
        count: 200,
        inGraveyard: 40,
        active: 160,
        color: rarityColors[4] || '#6366f1',
      },
      {
        rarity: 6,
        count: 100,
        inGraveyard: 20,
        active: 80,
        color: rarityColors[5] || '#6366f1',
      },
    ];
  }

  // Prepare data for display
  const chartData =
    viewMode === 'rarity'
      ? data.map(d => ({
          name: `Rarity ${d.rarity}`,
          value: d.count,
          color: d.color,
        }))
      : [
          {
            name: 'Active',
            value: data.reduce((sum, d) => sum + d.active, 0),
            color: '#10b981',
          },
          {
            name: 'In Graveyard',
            value: data.reduce((sum, d) => sum + d.inGraveyard, 0),
            color: '#f43f5e',
          },
        ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard
      title='NFT Distribution'
      icon={<PieChart className='h-5 w-5' />}
      color='purple'
      loading={isLoading}
    >
      {/* Tabs */}
      <div className='flex space-x-2 mb-4 text-xs'>
        <button
          onClick={() => setViewMode('rarity')}
          className={`px-3 py-1 rounded-md ${viewMode === 'rarity' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}
        >
          {t('distribution.byRarity')}
        </button>
        <button
          onClick={() => setViewMode('status')}
          className={`px-3 py-1 rounded-md ${viewMode === 'status' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}
        >
          {t('distribution.byStatus')}
        </button>
      </div>

      <div className='flex justify-center'>
        <div className='relative w-44 h-44'>
          <svg viewBox='0 0 100 100' className='w-full h-full rotate-[-90deg]'>
            {chartData.map((item, index) => {
              const percent = item.value / total;
              const offset = chartData
                .slice(0, index)
                .reduce((sum, d) => sum + d.value / total, 0);
              const dashArray = `${percent * 100} ${100 - percent * 100}`;
              return (
                <motion.circle
                  key={item.name}
                  cx='50'
                  cy='50'
                  r='40'
                  fill='transparent'
                  stroke={item.color}
                  strokeWidth='20'
                  strokeDasharray={dashArray}
                  strokeDashoffset={-offset * 100}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                />
              );
            })}
          </svg>
          {/* Center text */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-xl font-bold text-slate-200'>{total}</span>
            <span className='text-xs text-slate-400'>
              {t('distribution.nfts')}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className='flex flex-col mt-4 space-y-2'>
        {chartData.map(item => (
          <div key={item.name} className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div
                className='w-3 h-3 rounded-sm mr-2'
                style={{ backgroundColor: item.color }}
              />
              <span className='text-sm text-slate-300'>{item.name}</span>
            </div>
            <div className='flex items-center'>
              <span className='text-sm font-medium text-slate-200 mr-1'>
                {item.value}
              </span>
              <span className='text-xs text-slate-400'>
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'rarity' && (
        <div className='mt-4 pt-4 border-t border-slate-700/30'>
          <div className='text-xs text-slate-400 mb-2'>
            {t(
              'distribution.activeVsGraveyard',
              'Active vs In graveyard by rarity'
            )}
            :
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {data.map(item => (
              <div key={item.rarity} className='text-center'>
                <div className='text-xs font-medium text-slate-300'>
                  {t('distribution.rarity', 'Rarity')} {item.rarity}
                </div>
                <div className='flex h-2 mt-1 overflow-hidden rounded-full bg-slate-700/30'>
                  <div
                    className='bg-green-500'
                    style={{ width: `${(item.active / item.count) * 100}%` }}
                  ></div>
                  <div
                    className='bg-red-500'
                    style={{
                      width: `${(item.inGraveyard / item.count) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className='flex justify-between text-[10px] mt-1'>
                  <span className='text-green-400'>{item.active}</span>
                  <span className='text-red-400'>{item.inGraveyard}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
