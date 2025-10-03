import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { decodeEventLog, parseAbiItem } from 'viem';
import { monadChain } from '../config/chains';

const GAME_ADDR = monadChain.contracts.gameProxy.address;

// minimal ABI with only NFTBred event
const NFTBRED_ITEM = parseAbiItem(
  'event NFTBred(address indexed requester,uint256 parent1Id,uint256 parent2Id,uint256 revivedId)'
);

// BreedFinalized event with bonusStars
const BREED_FINALIZED_ITEM = parseAbiItem(
  'event BreedFinalized(address indexed user,uint256 revived,uint8 bonusStars)'
);

export interface BreedBonusInfo {
  tokenId: number;
  bonusStars: number;
  timestamp: number;
}

export const useLiveBredCubes = () => {
  const { address } = useAccount();
  const client = usePublicClient();
  const [revived, setRevived] = useState<number[]>([]);
  const [breedBonus, setBreedBonus] = useState<BreedBonusInfo | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Watch for NFTBred events
  useEffect(() => {
    if (!client || !address) return undefined;

    if (isWatching) {
      const unwatch = client.watchEvent({
        address: GAME_ADDR,
        event: NFTBRED_ITEM,
        onLogs: (logs: any[]) => {
          logs.forEach(log => {
            const { args } = decodeEventLog({
              abi: [NFTBRED_ITEM],
              eventName: 'NFTBred',
              ...log,
            });
            if (
              args &&
              typeof args === 'object' &&
              'requester' in args &&
              'revivedId' in args
            ) {
              if (
                (args.requester as string).toLowerCase() ===
                address.toLowerCase()
              ) {
                setRevived(prev =>
                  prev.includes(Number(args.revivedId))
                    ? prev
                    : [...prev, Number(args.revivedId)]
                );
              }
            }
          });
        },
      });
      return () => unwatch();
    }
    return undefined;
  }, [client, address, isWatching]);

  // Watch for BreedFinalized events (with bonus stars)
  useEffect(() => {
    if (!client || !address) return undefined;

    if (isWatching) {
      const unwatch = client.watchEvent({
        address: GAME_ADDR,
        event: BREED_FINALIZED_ITEM,
        onLogs: (logs: any[]) => {
          logs.forEach(log => {
            const { args } = decodeEventLog({
              abi: [BREED_FINALIZED_ITEM],
              eventName: 'BreedFinalized',
              ...log,
            });
            if (
              args &&
              typeof args === 'object' &&
              'user' in args &&
              'revived' in args &&
              'bonusStars' in args
            ) {
              if (
                (args.user as string).toLowerCase() ===
                address.toLowerCase()
              ) {
                const bonusStars = Number(args.bonusStars);
                // Only show celebration if there are bonus stars (3-5)
                if (bonusStars > 0) {
                  setBreedBonus({
                    tokenId: Number(args.revived),
                    bonusStars,
                    timestamp: Date.now(),
                  });
                }
              }
            }
          });
        },
      });
      return () => unwatch();
    }
    return undefined;
  }, [client, address, isWatching]);

  // Methods for controlling watching
  const startWatching = useCallback(() => setIsWatching(true), []);
  const stopWatching = useCallback(() => setIsWatching(false), []);
  const clearBreedBonus = useCallback(() => setBreedBonus(null), []);

  return {
    revived,
    breedBonus,
    clearBreedBonus,
    startWatching,
    stopWatching,
    isWatching,
  };
};
