import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { apeChain } from '@/config/chains';

// GeckoTerminal API for specific CRAA pool on ApeChain
const GECKO_TERMINAL_API = 'https://api.geckoterminal.com/api/v2';
const CRAA_TOKEN_ADDRESS = '0xBb526D657Cc1Ba772469A6EC96AcB2ed9D2A93e5';
const CRAA_POOL_ADDRESS = '0xc9c2f86e542620daf12107d4b6eda37936efb903';
const APECHAIN_NETWORK = 'apechain';

// Public Viem client for reading contract data
const publicClient = createPublicClient({
  chain: apeChain,
  transport: http(),
});

// ERC20 ABI for reading token data
const ERC20_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export async function GET() {
  try {
    // Fetch CRAA token data from GeckoTerminal
    const tokenUrl = `${GECKO_TERMINAL_API}/networks/${APECHAIN_NETWORK}/tokens/${CRAA_TOKEN_ADDRESS}`;
    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to fetch CRAA token data: ${tokenResponse.status}`
      );
    }

    const tokenData = await tokenResponse.json();

    // Extract price data
    const priceUsd = tokenData?.data?.attributes?.price_usd || '0';
    const volume24h = tokenData?.data?.attributes?.volume_usd_24h || '0';
    const marketCap = tokenData?.data?.attributes?.market_cap_usd || '0';

    // Read on-chain data
    const [totalSupply, deadBalance] = await Promise.all([
      publicClient.readContract({
        address: CRAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: CRAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: ['0x000000000000000000000000000000000000dEaD' as `0x${string}`],
      }),
    ]);

    const result = {
      success: true,
      data: {
        priceUsd: parseFloat(priceUsd),
        volume24h: parseFloat(volume24h),
        marketCap: parseFloat(marketCap),
        totalSupply: totalSupply.toString(),
        deadBalance: deadBalance.toString(),
        timestamp: Date.now(),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          priceUsd: 0,
          volume24h: 0,
          marketCap: 0,
          totalSupply: '0',
          deadBalance: '0',
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}
