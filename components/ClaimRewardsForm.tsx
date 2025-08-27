'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useSafeContractWrite } from '@/hooks/use-safe-contract-write';
import { nftAbi } from '@/config/abis/nftAbi';
import { NFT_CONTRACT_ADDRESS, MAIN_CHAIN_ID } from '@/config/wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useNetwork } from '@/hooks/use-network';
import { useTranslation } from 'react-i18next';

export function ClaimRewardsForm() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState<string>('');
  const { isApeChain, requireApeChain } = useNetwork();
  const { t } = useTranslation();

  const { data: burnRecord, isLoading: isLoadingRecord } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: 'burnRecords',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    chainId: MAIN_CHAIN_ID,
    query: { enabled: !!tokenId },
  });

  const {
    writeContract,
    isPending: isClaiming,
    error,
  } = useSafeContractWrite();

  const handleClaim = requireApeChain(async () => {
    if (!tokenId) return;
    try {
      await writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: nftAbi,
        functionName: 'claimBurnRewards',
        args: [BigInt(tokenId)],
        chainId: MAIN_CHAIN_ID,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Claim failed';
      console.error('Claim error:', errorMessage);
    }
  });

  if (!address) return <p>Please connect your wallet.</p>;

  return (
    <Card className='mx-auto max-w-md mt-6'>
      <CardHeader>
        <CardTitle>Claim CRA Rewards</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <input
          type='number'
          placeholder='Burned NFT ID'
          value={tokenId}
          onChange={e => setTokenId(e.target.value)}
          className='w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none'
        />
        {isLoadingRecord ? (
          <Loader2 className='animate-spin' />
        ) : burnRecord &&
          (
            burnRecord as { lockedAmount: bigint; waitPeriod: bigint; burnTime: bigint; claimed: boolean }
          ).burnTime > 0 ? (
          <div className='text-sm'>
            <p>
              Total amount:{' '}
              {Number(
                (
                  burnRecord as { lockedAmount: bigint; waitPeriod: bigint; burnTime: bigint; claimed: boolean }
                ).lockedAmount
              ) / 1e18}{' '}
              CRA
            </p>
            <p>
              Claim available time:{' '}
              {new Date(
                Number(
                  (
                    burnRecord as { lockedAmount: bigint; waitPeriod: bigint; burnTime: bigint; claimed: boolean }
                  ).burnTime
                ) * 1000
              ).toLocaleString()}
            </p>
            <p>
              Claimed:{' '}
              {(
                burnRecord as { lockedAmount: bigint; waitPeriod: bigint; burnTime: bigint; claimed: boolean }
              ).claimed
                ? t('status.claimed', 'Yes')
                : t('status.notClaimed', 'No')}
            </p>
          </div>
        ) : null}
        {error && <p className='text-red-500 text-sm'>{error.message}</p>}
        <Button
          disabled={!isApeChain || !tokenId || isClaiming}
          onClick={handleClaim}
          className='w-full'
        >
          {isClaiming
            ? t('status.confirming', 'Confirming...')
            : t('status.claim', 'Claim')}
        </Button>
      </CardContent>
    </Card>
  );
}
