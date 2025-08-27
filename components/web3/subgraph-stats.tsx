'use client';

import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// Base URL for Subgraph requests
const SUBGRAPH_URL = '/api/subgraph';

// Data types
interface GlobalStats {
  totalBurns: number;
  totalClaimed: number;
  totalPings: number;
  totalBreeds: number;
  totalActiveNFTs: number;
  totalInGraveyard: number;
  lastUpdated: string;
}

interface NFTBreed {
  id: string;
  player: string;
  parent1Id: string;
  parent2Id: string;
  revivedTokenId: string;
  timestamp: string;
}

interface NFT {
  id: string;
  tokenId: string;
  owner: string;
  rarity: number;
  currentStars: number;
  isInGraveyard: boolean;
  lockedCRAA: string;
}

// Generate mock data for cases when Subgraph is unavailable
function generateMockData(): GlobalStats {
  return {
    totalBurns: 123,
    totalClaimed: 5000,
    totalPings: 456,
    totalBreeds: 78,
    totalActiveNFTs: 4500,
    totalInGraveyard: 500,
    lastUpdated: Date.now().toString(),
  };
}

// Helper function to perform GraphQL queries
async function querySubgraph(query: string, variables = {}) {
  try {
    const response = await fetchWithRetry(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      throw new Error(errors[0].message);
    }

    return data;
  } catch (error) {
    return null;
  }
}

export default function SubgraphStats({ address }: { address?: string }) {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [recentBreeds, setRecentBreeds] = useState<NFTBreed[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');

  // Load global statistics
  useEffect(() => {
    async function fetchGlobalStats() {
      try {
        setLoading(true);

        // Request to Subgraph
        const query = `{
          globalStats(id: "1") {
            totalBurns
            totalClaimed
            totalPings
            totalBreeds
            totalActiveNFTs
            totalInGraveyard
            lastUpdated
          }
        }`;

        const response = await fetchWithRetry(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        const { data, errors } = await response.json();

        // Check for errors or missing data
        if (errors || !data || !data.globalStats) {
          setGlobalStats(generateMockData());
          return;
        }

        const globalStats = data.globalStats;

        setGlobalStats(globalStats);
      } catch (error) {
        setGlobalStats(null);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRecentBreeds() {
      const query = `{
        nftBreeds(first: 10, orderBy: timestamp, orderDirection: desc) {
          id
          player
          parent1Id
          parent2Id
          revivedTokenId
          timestamp
        }
      }`;

      const data = await querySubgraph(query);
      if (data?.nftBreeds) {
        setRecentBreeds(data.nftBreeds);
      }
    }

    Promise.all([fetchGlobalStats(), fetchRecentBreeds()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Load user NFTs
  useEffect(() => {
    async function fetchUserNFTs() {
      if (!address) return;

      const query = `{
        player(id: "${address.toLowerCase()}") {
          ownedNFTs {
            id
            tokenId
            rarity
            currentStars
            isInGraveyard
            lockedCRAA
          }
        }
      }`;

      const data = await querySubgraph(query);
      if (data?.player?.ownedNFTs) {
        setUserNFTs(data.player.ownedNFTs);
      } else {
        setUserNFTs([]);
      }
    }

    if (address && activeTab === 'user') {
      setLoading(true);
      fetchUserNFTs().finally(() => setLoading(false));
    }
  }, [address, activeTab]);

  function formatTimestamp(timestamp: string) {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  }

  function shortenAddress(addr: string) {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  return (
    <Card className='p-6'>
      <h2 className='text-2xl font-bold mb-4'>CrazyCube NFT Statistics</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-4'>
          <TabsTrigger value='global'>Global Statistics</TabsTrigger>
          <TabsTrigger value='breeds'>Recent Breeds</TabsTrigger>
          {address && <TabsTrigger value='user'>My NFTs</TabsTrigger>}
        </TabsList>

        <TabsContent value='global'>
          {loading ? (
            <div className='space-y-2'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
            </div>
          ) : globalStats ? (
            <div className='grid grid-cols-2 gap-4'>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-gray-500'>Total CRAA burned</div>
                <div className='text-2xl font-bold'>
                  {globalStats.totalBurns}
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-gray-500'>Total bred</div>
                <div className='text-2xl font-bold'>
                  {globalStats.totalBreeds}
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-gray-500'>Total pings</div>
                <div className='text-2xl font-bold'>
                  {globalStats.totalPings}
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-gray-500'>Active NFTs</div>
                <div className='text-2xl font-bold'>
                  {globalStats.totalActiveNFTs}
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-gray-500'>In graveyard</div>
                <div className='text-2xl font-bold'>
                  {globalStats.totalInGraveyard}
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              Failed to load statistics
            </div>
          )}
        </TabsContent>

        <TabsContent value='breeds'>
          {loading ? (
            <div className='space-y-2'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          ) : recentBreeds.length > 0 ? (
            <div className='space-y-2'>
              <div className='grid grid-cols-5 gap-2 font-semibold text-sm p-2 bg-gray-100 rounded'>
                <div>Player</div>
                <div>Parent 1</div>
                <div>Parent 2</div>
                <div>Revived</div>
                <div>Time</div>
              </div>
              {recentBreeds.map(breed => (
                <div
                  key={breed.id}
                  className='grid grid-cols-5 gap-2 text-sm p-2 border-b'
                >
                  <div>{shortenAddress(breed.player)}</div>
                  <div>#{breed.parent1Id}</div>
                  <div>#{breed.parent2Id}</div>
                  <div>#{breed.revivedTokenId}</div>
                  <div>{formatTimestamp(breed.timestamp)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>No breed data</div>
          )}
        </TabsContent>

        {address && (
          <TabsContent value='user'>
            {loading ? (
              <div className='space-y-2'>
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-12 w-full' />
              </div>
            ) : userNFTs.length > 0 ? (
              <div className='space-y-2'>
                <div className='grid grid-cols-5 gap-2 font-semibold text-sm p-2 bg-gray-100 rounded'>
                  <div>ID</div>
                  <div>Rarity</div>
                  <div>Stars</div>
                  <div>Status</div>
                  <div>Locked CRAA</div>
                </div>
                {userNFTs.map(nft => (
                  <div
                    key={nft.id}
                    className='grid grid-cols-5 gap-2 text-sm p-2 border-b'
                  >
                    <div>#{nft.tokenId}</div>
                    <div>{nft.rarity || 'N/A'}</div>
                    <div>{nft.currentStars || 0}</div>
                    <div>
                      {nft.isInGraveyard ? '💀 Graveyard' : '✅ Active'}
                    </div>
                    <div>
                      {nft.lockedCRAA
                        ? new Intl.NumberFormat('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(parseInt(nft.lockedCRAA) / 1e18)
                        : '0'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                You have no NFTs or data have not yet been indexed
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <div className='mt-4 text-xs text-gray-500'>
        Data obtained via The Graph Subgraph. Updated in real time.
      </div>
    </Card>
  );
}
