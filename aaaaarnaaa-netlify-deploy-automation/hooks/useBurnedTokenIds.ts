import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { monadChain } from '../config/chains';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const GAME_ADDRESS = monadChain.contracts.gameProxy.address;

const GAME_ABI = [
  'function totalBurned() view returns (uint256)',
  'function graveyardTokens(uint256) view returns (uint256)',
] as const;

const NFT_BURNED_EVENT = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'player', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
  name: 'NFTBurned',
  type: 'event',
} as const;

export function useBurnedTokenIds() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!isConnected || !address) {
        setTokenIds([]);
        return;
      }
      const cacheKey = `crazycube:burn:${address.toLowerCase()}`;
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (Date.now() - cached.ts < CACHE_TTL_MS) {
            setTokenIds(cached.ids);
            return;
          }
        } catch {}
      }
      if (!publicClient) return;
      setLoading(true);
      setError(null);
      try {
        const sizeBig = (await publicClient.readContract({
          address: GAME_ADDRESS,
          abi: GAME_ABI,
          functionName: 'totalBurned',
        })) as bigint;
        const size = Number(sizeBig);
        const set = new Set<string>();
        for (let i = 0; i < size; i++) {
          const tid: bigint = (await publicClient.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'graveyardTokens',
            args: [BigInt(i)],
          })) as bigint;
          set.add(tid.toString());
        }
        // logs
        try {
          const logs = (await publicClient.getLogs({
            address: GAME_ADDRESS,
            event: NFT_BURNED_EVENT,
            args: { player: address },
          })) as any[];
          logs.forEach(l => set.add(BigInt(l.args.tokenId).toString()));
        } catch (e) {}
        const ids = Array.from(set);
        setTokenIds(ids);
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), ids }));
      } catch (e: any) {
        setError(e.message || 'error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address, isConnected, publicClient]);

  return { tokenIds, loading, error };
}
