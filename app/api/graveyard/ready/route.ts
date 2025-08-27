import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { apeChain } from '@/config/chains';

// CrazyCube game contract deployed on ApeChain mainnet
const GAME_ADDRESS = '0x7dFb75F1000039D650A4C2B8a068f53090e857dD' as const;

// Minimal ABI fragments that we need
const GAME_ABI = [
  {
    inputs: [],
    name: 'getGraveyardSize',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'graveyardTokens',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'burnRecords',
    outputs: [
      { type: 'address' }, // owner
      { type: 'uint256' }, // totalAmount
      { type: 'uint256' }, // claimAvailableTime
      { type: 'uint256' }, // graveyardReleaseTime
      { type: 'bool' }, // claimed
      { type: 'uint8' }, // waitPeriod
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Always execute server-side so we avoid browser CORS restrictions
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = createPublicClient({ chain: apeChain, transport: http() });

    const sizeBn = (await client.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'getGraveyardSize',
    })) as bigint;

    const size = Number(sizeBn);
    const readyTokens: string[] = [];
    const notReadyTokens: string[] = [];
    const currentTime = Math.floor(Date.now() / 1000);

    // Check each token in graveyard
    for (let i = 0; i < size; i++) {
      try {
        const tokenIdBn = (await client.readContract({
          address: GAME_ADDRESS,
          abi: GAME_ABI,
          functionName: 'graveyardTokens',
          args: [BigInt(i)],
        })) as bigint;

        const tokenId = tokenIdBn.toString();

        try {
          // Check burn record
          const burnRecord = (await client.readContract({
            address: GAME_ADDRESS,
            abi: GAME_ABI,
            functionName: 'burnRecords',
            args: [tokenIdBn],
          })) as readonly [
            `0x${string}`,
            bigint,
            bigint,
            bigint,
            boolean,
            number,
          ];

          const [
            owner,
            totalAmount,
            claimAvailableTime,
            graveyardReleaseTime,
            claimed,
            waitPeriod,
          ] = burnRecord;

          const claimTime = Number(claimAvailableTime);
          const releaseTime = Number(graveyardReleaseTime);

          // Determine readiness
          let isReady = false;

          if (!claimed) {
            if (releaseTime > 0 && releaseTime <= currentTime) {
              isReady = true; // new contract >=v3
            } else if (
              releaseTime === 0 &&
              claimTime > 0 &&
              claimTime <= currentTime
            ) {
              isReady = true; // old records
            }
          }

          if (isReady) {
            readyTokens.push(tokenId);
          } else {
            notReadyTokens.push(tokenId);
          }
        } catch (burnError: unknown) {
          // If we can't read burn record, consider token not ready
          notReadyTokens.push(tokenId);
        }
      } catch (tokenError: unknown) {}
    }

    const response = {
      totalTokens: size,
      readyTokens,
      notReadyTokens,
      hasReady: readyTokens.length > 0,
      timestamp: currentTime,
    };

    // Cache the response for 30 seconds to reduce RPC load
    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
