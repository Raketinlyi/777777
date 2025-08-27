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
] as const;

// Always execute server-side so we avoid browser CORS restrictions
// export const dynamic = 'force-dynamic'; // Disabled for static export

export async function GET() {
  try {
    const client = createPublicClient({ chain: apeChain, transport: http() });

    const sizeBn = (await client.readContract({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: 'getGraveyardSize',
    })) as bigint;

    const size = Number(sizeBn);
    const ids: string[] = [];

    // Fetch sequentially (size is expected to be small); if it grows large, optimise later
    for (let i = 0; i < size; i++) {
      const idBn = (await client.readContract({
        address: GAME_ADDRESS,
        abi: GAME_ABI,
        functionName: 'graveyardTokens',
        args: [BigInt(i)],
      })) as bigint;
      ids.push(idBn.toString());
    }

    // Cache the response for 1 minute to reduce RPC load
    return NextResponse.json(
      { tokens: ids },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
