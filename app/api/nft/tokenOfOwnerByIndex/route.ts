import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { apeChain } from '@/config/chains';
import { nftAbi } from '@/config/abis/nftAbi';
import { z } from 'zod';

// export const dynamic = 'force-dynamic'; // Disabled for static export

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const index = searchParams.get('index');

    // Validate params using zod
    const schema = z.object({
      owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      index: z.string().regex(/^\d+$/),
    });

    const parse = schema.safeParse({ owner, index });
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { owner: ownerAddr, index: indexStr } = parse.data;

    const client = createPublicClient({
      chain: apeChain,
      transport: http(),
    });

    const tokenId = await client.readContract({
      address: apeChain.contracts.crazyCubeNFT.address as `0x${string}`,
      abi: nftAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [ownerAddr as `0x${string}`, BigInt(indexStr)],
    });

    return NextResponse.json({ tokenId: tokenId.toString() });
  } catch (error) {
    // CRITICAL: Do not return mock data on error in production.
    // This would mislead the user and show them incorrect NFTs.
    // Always return a proper error response.
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to fetch token ID from the contract',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
