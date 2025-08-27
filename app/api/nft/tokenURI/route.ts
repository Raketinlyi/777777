import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { apeChain } from '@/config/chains';
import { nftAbi } from '@/config/abis/nftAbi';
import { z } from 'zod';

// export const dynamic = 'force-dynamic'; // Disabled for static export

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    // Validate tokenId with zod (integer 0-5000)
    const schema = z.string().regex(/^\d+$/);
    const val = schema.safeParse(tokenId ?? '');
    if (!val.success) {
      return NextResponse.json(
        { error: 'Invalid tokenId parameter' },
        { status: 400 }
      );
    }
    const idNum = Number(val.data);
    if (idNum < 0 || idNum > 5000) {
      return NextResponse.json(
        { error: 'tokenId out of range' },
        { status: 400 }
      );
    }

    const client = createPublicClient({
      chain: apeChain,
      transport: http(),
    });

    try {
      const tokenURI = await client.readContract({
        address: apeChain.contracts.crazyCubeNFT.address as `0x${string}`,
        abi: nftAbi,
        functionName: 'tokenURI',
        args: [BigInt(idNum)],
      });

      return NextResponse.json({ tokenURI });
    } catch (contractError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch token URI from contract',
          details:
            contractError instanceof Error
              ? contractError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
