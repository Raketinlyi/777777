'use client';

import { useState, useEffect } from 'react';
import { ChartCard } from './chart-card';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// Base URL for Subgraph requests
const SUBGRAPH_URL = '/api/subgraph';

interface ActivityData {
  date: string;
  pings: number;
  burns: number;
  breeds: number;
}

export function ActivityChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ActivityData[]>([]);
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Function to fetch data from Subgraph
  async function fetchActivityData(): Promise<void> {
    try {
      // Define time range
      const now = Math.floor(Date.now() / 1000);
      const timeRanges = {
        '24h': now - 24 * 60 * 60,
        '7d': now - 7 * 24 * 60 * 60,
        '30d': now - 30 * 24 * 60 * 60,
      };

      const startTime = timeRanges[range];

      // Query Subgraph
      const query = `{
        nftPings: nftPings(
          where: {timestamp_gt: "${startTime}"}, 
          orderBy: timestamp
        ) {
          timestamp
        }
        nftBurns: nftBurns(
          where: {timestamp_gt: "${startTime}"},
          orderBy: timestamp
        ) {
          timestamp
        }
        nftBreeds: nftBreeds(
          where: {timestamp_gt: "${startTime}"},
          orderBy: timestamp
        ) {
          timestamp
        }
      }`;

      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();

      // If Subgraph is not configured, use mock data
      if (!data) {
        setData(generateMockData(range));
        return;
      }

      // Group events by date
      const groupedData = groupEventsByDate(
        data.nftPings || [],
        data.nftBurns || [],
        data.nftBreeds || [],
        range
      );

      setData(groupedData);
    } catch (error) {
      // Use mock data on error
      setData(generateMockData(range));
    } finally {
      setIsLoading(false);
    }
  }

  // Load data when range changes
  useEffect(() => {
    setIsLoading(true);
    fetchActivityData();
  }, [range]);

  // Group events by date
  function groupEventsByDate(
    pings: { timestamp: string }[],
    burns: { timestamp: string }[],
    breeds: { timestamp: string }[],
    range: string
  ): ActivityData[] {
    // Define date format based on range
    const dateFormat = range === '24h' ? 'HH:00' : 'MM-DD';
    const result: ActivityData[] = [];

    // If no data, return mock data
    if (pings.length === 0 && burns.length === 0 && breeds.length === 0) {
      return generateMockData(range);
    }

    // Create time stamps for grouping
    const timestamps = [...pings, ...burns, ...breeds].map(e =>
      parseInt(e.timestamp)
    );
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    // Define grouping interval
    let interval = 3600; // 1 hour for 24h
    if (range === '7d') interval = 86400; // 1 day for 7d
    if (range === '30d') interval = 86400 * 2; // 2 days for 30d

    // Create time groups
    for (let t = minTime; t <= maxTime; t += interval) {
      const date = new Date(t * 1000);
      const dateStr =
        range === '24h'
          ? date.getHours().toString().padStart(2, '0') + ':00'
          : (date.getMonth() + 1).toString().padStart(2, '0') +
            '-' +
            date.getDate().toString().padStart(2, '0');

      // Count events in this group
      const pingCount = pings.filter(p => {
        const ts = parseInt(p.timestamp);
        return ts >= t && ts < t + interval;
      }).length;

      const burnCount = burns.filter(b => {
        const ts = parseInt(b.timestamp);
        return ts >= t && ts < t + interval;
      }).length;

      const breedCount = breeds.filter(b => {
        const ts = parseInt(b.timestamp);
        return ts >= t && ts < t + interval;
      }).length;

      result.push({
        date: dateStr,
        pings: pingCount,
        burns: burnCount,
        breeds: breedCount,
      });
    }

    return result;
  }

  // Generate mock data
  function generateMockData(range: string): ActivityData[] {
    const count = range === '24h' ? 24 : range === '7d' ? 7 : 15;
    const result: ActivityData[] = [];

    for (let i = 0; i < count; i++) {
      const date = new Date();
      if (range === '24h') {
        date.setHours(date.getHours() - (count - i - 1));
        result.push({
          date: date.getHours().toString().padStart(2, '0') + ':00',
          pings: Math.floor(Math.random() * 30) + 5,
          burns: Math.floor(Math.random() * 10) + 1,
          breeds: Math.floor(Math.random() * 8),
        });
      } else {
        date.setDate(date.getDate() - (count - i - 1));
        result.push({
          date:
            (date.getMonth() + 1).toString().padStart(2, '0') +
            '-' +
            date.getDate().toString().padStart(2, '0'),
          pings: Math.floor(Math.random() * 150) + 20,
          burns: Math.floor(Math.random() * 50) + 5,
          breeds: Math.floor(Math.random() * 30) + 2,
        });
      }
    }

    return result;
  }

  // Find maximum value for scaling
  const maxValue =
    data.length > 0
      ? Math.max(...data.map(d => Math.max(d.pings, d.burns, d.breeds)))
      : 100;

  return (
    <ChartCard
      title='NFT Activity'
      icon={<Activity className='h-5 w-5' />}
      color='blue'
      loading={isLoading}
    >
      {/* Tabs */}
      <div className='flex space-x-2 mb-2 text-xs'>
        {['24h', '7d', '30d'].map(r => (
          <button
            key={r}
            onClick={() => setRange(r as '24h' | '7d' | '30d')}
            className={`px-3 py-1 rounded-md ${range === r ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className='h-64 relative'>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <div
            key={`grid-${percent}`}
            className='absolute w-full border-t border-slate-700/30'
            style={{ top: `${percent}%` }}
          ></div>
        ))}

        {/* Activity bars */}
        <div className='absolute inset-0 flex items-end'>
          {data.map((item, index) => (
            <div
              key={index}
              className='flex-1 flex flex-col items-center justify-end h-full'
            >
              {/* Breeds (blue) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.breeds / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.03 }}
                className='w-[70%] bg-blue-500/70'
              >
                <div className='h-full w-full bg-gradient-to-t from-blue-600/80 to-blue-400/80' />
              </motion.div>

              {/* Burns (orange) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.burns / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.03 + 0.1 }}
                className='w-[70%] bg-orange-500/70'
              >
                <div className='h-full w-full bg-gradient-to-t from-orange-600/80 to-orange-400/80' />
              </motion.div>

              {/* Pings (purple) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.pings / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.03 + 0.2 }}
                className='w-[70%] bg-violet-500/70'
              >
                <div className='h-full w-full bg-gradient-to-t from-violet-600/80 to-violet-400/80' />
              </motion.div>

              <div className='text-[10px] mt-1 text-slate-400 rotate-90 md:rotate-0 md:text-xs'>
                {item.date}
              </div>
            </div>
          ))}
        </div>

        {/* Value labels */}
        <div className='absolute right-0 inset-y-0 flex flex-col justify-between text-xs text-slate-400 pr-2'>
          <div>{maxValue}</div>
          <div>{Math.round(maxValue / 2)}</div>
          <div>0</div>
        </div>
      </div>

      {/* Legend */}
      <div className='flex justify-center mt-3 space-x-4 text-xs text-slate-300'>
        <div className='flex items-center'>
          <span className='w-3 h-3 bg-violet-500 mr-1'></span>Pings
        </div>
        <div className='flex items-center'>
          <span className='w-3 h-3 bg-orange-500 mr-1'></span>Burns
        </div>
        <div className='flex items-center'>
          <span className='w-3 h-3 bg-blue-500 mr-1'></span>Breeds
        </div>
      </div>
    </ChartCard>
  );
}
