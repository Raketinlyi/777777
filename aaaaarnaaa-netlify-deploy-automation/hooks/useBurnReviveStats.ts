'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { monadChain } from '../config/chains';

const GAME_ADDRESS = monadChain.contracts.gameProxy.address;
const BURN_TOPIC =
  '0x395e82a632c09e2530de3268c938c809f5d457f41726b2dfcae6ea8657fca2cc'; // keccak256("Burn(address,uint256,uint8)")
const REVIVE_TOPIC =
  '0x3df601c7a509a68e2db279b1091d651d81d77ec2a3f8b80b9dcd51cb07cdbcfa'; // keccak256("Revive(address,uint256)")

export interface SeriesPoint {
  date: string;
  burn: number;
  revive: number;
}
export interface BurnReviveStats {
  last24h: SeriesPoint[];
  last7d: SeriesPoint[];
  last30d: SeriesPoint[];
  totalBurn: number;
  totalRevive: number;
}

export const useBurnReviveStats = () => {
  const client = usePublicClient();
  const [stats, setStats] = useState<BurnReviveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) return;
    const mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        // for demo fetch last 30 days logs
        const now = Math.floor(Date.now() / 1000);
        const fromTs = now - 86400 * 30;
        // rough block range: assume 2s block, 30d ~1.3M blocks; just take last 1.5M blocks
        const latest = await client.getBlockNumber();
        const fromBlock = latest - 1500000n > 0n ? latest - 1500000n : 0n;
        const logs = await client.getLogs({
          address: GAME_ADDRESS,
          fromBlock,
          toBlock: latest,
          topics: [[BURN_TOPIC, REVIVE_TOPIC]],
        } as any);
        const burnMap = new Map<string, number>();
        const reviveMap = new Map<string, number>();
        for (const log of logs) {
          const block = await client.getBlock({ blockNumber: log.blockNumber });
          const ts = Number(block.timestamp);
          if (ts < fromTs) continue;
          const dayKey = new Date(ts * 1000).toISOString().slice(0, 10);
          if (log.topics[0] === BURN_TOPIC) {
            burnMap.set(dayKey, (burnMap.get(dayKey) || 0) + 1);
          } else {
            reviveMap.set(dayKey, (reviveMap.get(dayKey) || 0) + 1);
          }
        }
        const buildSeries = (days: number) => {
          const arr: SeriesPoint[] = [];
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date((now - 86400 * i) * 1000)
              .toISOString()
              .slice(0, 10);
            arr.push({
              date: d,
              burn: burnMap.get(d) || 0,
              revive: reviveMap.get(d) || 0,
            });
          }
          return arr;
        };
        const res: BurnReviveStats = {
          last24h: buildSeries(1),
          last7d: buildSeries(7),
          last30d: buildSeries(30),
          totalBurn: [...burnMap.values()].reduce((a, b) => a + b, 0),
          totalRevive: [...reviveMap.values()].reduce((a, b) => a + b, 0),
        };
        if (mounted) setStats(res);
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
  }, [client]);

  return { stats, loading };
};
