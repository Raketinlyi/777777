'use client';

import { useAccount } from 'wagmi';
import { usePendingBurnRewards } from '@/hooks/usePendingBurnRewards';
import { monadChain } from '@/config/chains';

export function DebugRewards() {
  const { address, isConnected } = useAccount();
  const { rewards, loading, error, refresh } = usePendingBurnRewards();

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 text-white">
      <h3 className="text-lg font-bold mb-2">DEBUG REWARDS</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Wallet:</strong> {isConnected ? address : 'Not connected'}
        </div>
        
        <div>
          <strong>Reader Address:</strong> {monadChain.contracts?.reader?.address || 'Not set'}
        </div>
        
        <div>
          <strong>Core Address:</strong> {monadChain.contracts?.gameProxy?.address || 'Not set'}
        </div>
        
        <div className="mt-3 p-2 bg-gray-700 rounded">
          <strong>ENV Variables:</strong>
          <div className="ml-2 mt-1 text-xs">
            <div>NEXT_PUBLIC_READER_ADDRESS: {process.env.NEXT_PUBLIC_READER_ADDRESS || 'undefined'}</div>
            <div>NEXT_PUBLIC_CORE_PROXY: {process.env.NEXT_PUBLIC_CORE_PROXY || 'undefined'}</div>
            <div>NEXT_PUBLIC_MONAD_CHAIN_ID: {process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || 'undefined'}</div>
          </div>
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
        
        <div>
          <strong>Rewards Found:</strong> {rewards?.length || 0}
        </div>
        
        {rewards && rewards.length > 0 && (
          <div>
            <strong>Rewards Details:</strong>
            <ul className="ml-4 mt-1">
              {rewards.map((reward, i) => (
                <li key={i}>
                  NFT #{reward.tokenId} - {reward.totalAmount} OCTA - Claimable: {reward.claimAt ? new Date(reward.claimAt * 1000).toLocaleString() : 'Now'}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <button 
          onClick={refresh}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded mt-2"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}