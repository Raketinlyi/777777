'use client';

import { usePendingBurnRewards } from '@/hooks/usePendingBurnRewards';
import { useAccount } from 'wagmi';
import { monadChain } from '@/config/chains';

export function DebugRewards() {
  const { address, isConnected } = useAccount();
  const { rewards, loading, error } = usePendingBurnRewards();

  const READER_ADDR = monadChain.contracts?.reader?.address;
  const CORE_ADDR = monadChain.contracts?.gameProxy?.address;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">🔍 DEBUG REWARDS</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Wallet:</strong> {address || 'NO'}</div>
      <div><strong>Connected:</strong> {isConnected ? 'YES' : 'NO'}</div>
      <div><strong>Reader:</strong> {READER_ADDR || 'NO'}</div>
      <div><strong>Core:</strong> {CORE_ADDR || 'NO'}</div>
      <div><strong>Loading:</strong> {loading ? 'YES' : 'NO'}</div>
      <div><strong>Error:</strong> {error || 'NO'}</div>
        <div><strong>Rewards:</strong> {rewards.length}</div>
        
        {rewards.length > 0 && (
          <div className="mt-4">
            <strong>Found rewards:</strong>
            {rewards.map((reward, i) => (
              <div key={i} className="ml-4 p-2 bg-white rounded">
                <div>NFT #{reward.tokenId}</div>
                <div>Amount: {reward.totalAmount}</div>
                <div>Claimable: {reward.isClaimable ? 'YES' : 'NO'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}