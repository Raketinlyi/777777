import { NextRequest, NextResponse } from 'next/server';
import { apeChain } from '@/config/chains';
import { alchemyFetch } from '@/lib/alchemyFetch';
import { z } from 'zod';

// export const dynamic = 'force-dynamic'; // Disabled for static export

// ERC-721 balanceOf function signature
const BALANCE_OF_SIGNATURE = '0x70a08231';
// ERC-721 tokenOfOwnerByIndex function signature
const TOKEN_OF_OWNER_BY_INDEX_SIGNATURE = '0x2f745c59';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');

    if (!owner) {
      return NextResponse.json(
        { error: 'Missing owner parameter' },
        { status: 400 }
      );
    }

    // Zod validation
    const Schema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
    const parseResult = Schema.safeParse(owner);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid owner address' },
        { status: 400 }
      );
    }

    const ownerAddr = parseResult.data as `0x${string}`;
    const contractAddr = apeChain.contracts.crazyCubeNFT.address;

    // Get NFT balance using balanceOf
    const balanceCall = await alchemyFetch('rpc', '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddr,
            data: `${BALANCE_OF_SIGNATURE}${ownerAddr.slice(2).padStart(64, '0')}`,
          },
          'latest',
        ],
      }),
    });

    if (!balanceCall.ok) {
      const text = await balanceCall.text();
      return NextResponse.json(
        { error: `Failed to get balance: ${text}` },
        { status: balanceCall.status }
      );
    }

    const balanceResult = await balanceCall.json();
    if (balanceResult.error) {
      return NextResponse.json(
        { error: `Balance call error: ${balanceResult.error.message}` },
        { status: 400 }
      );
    }

    const balance = parseInt(balanceResult.result, 16);

    if (balance === 0) {
      return NextResponse.json({
        ownedNfts: [],
        totalCount: 0,
        pageKey: null,
      });
    }

    // Get all token IDs owned by this address
    const tokenIds: string[] = [];

    for (let i = 0; i < balance; i++) {
      const tokenIndex = i.toString(16).padStart(64, '0');
      const tokenCall = await alchemyFetch('rpc', '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: i + 2,
          method: 'eth_call',
          params: [
            {
              to: contractAddr,
              data: `${TOKEN_OF_OWNER_BY_INDEX_SIGNATURE}${ownerAddr.slice(2).padStart(64, '0')}${tokenIndex}`,
            },
            'latest',
          ],
        }),
      });

      if (tokenCall.ok) {
        const tokenResult = await tokenCall.json();
        if (tokenResult.result) {
          const tokenId = parseInt(tokenResult.result, 16).toString();
          tokenIds.push(tokenId);
        }
      }
    }

    // Format response to match Alchemy NFT API format
    const nfts = tokenIds.map(tokenId => ({
      contract: {
        address: contractAddr,
      },
      id: {
        tokenId: tokenId,
        tokenMetadata: {
          tokenType: 'ERC721',
        },
      },
      title: `CrazyCube #${tokenId}`,
      description: `CrazyCube NFT #${tokenId}`,
      tokenUri: {
        raw: `https://api.crazycube.com/metadata/${tokenId}`,
        gateway: `https://api.crazycube.com/metadata/${tokenId}`,
      },
      media: [
        {
          raw: `https://api.crazycube.com/images/${tokenId}.png`,
          gateway: `https://api.crazycube.com/images/${tokenId}.png`,
          thumbnail: `https://api.crazycube.com/images/${tokenId}.png`,
          format: 'png',
          bytes: 0,
        },
      ],
      metadata: {
        name: `CrazyCube #${tokenId}`,
        description: `CrazyCube NFT #${tokenId}`,
        image: `https://api.crazycube.com/images/${tokenId}.png`,
        external_url: `https://crazycube.com/nft/${tokenId}`,
        attributes: [],
      },
      timeLastUpdated: new Date().toISOString(),
    }));

    return NextResponse.json({
      ownedNfts: nfts,
      totalCount: nfts.length,
      pageKey: null,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching NFTs:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
