import 'dotenv/config';
import { createPublicClient, http } from 'viem';
import { CRAZY_OCTAGON_READER_ABI } from '../lib/abi/crazyOctagon.ts';

const stringify = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(stringify);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, stringify(val)]);
    return Object.fromEntries(entries);
  }
  return value;
};

const getRpcUrl = () => {
  const rpc = process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC;
  if (rpc) return rpc;

  const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  ALCHEMY_API_KEY not set, using public fallback RPC');
    return 'https://monad-testnet.rpc.caldera.xyz/http';
  }

  return `https://monad-testnet.g.alchemy.com/v2/${apiKey}`;
};

async function main() {
  const rpc = getRpcUrl();
  const reader = (process.env.NEXT_PUBLIC_READER_ADDRESS || '0xF9017a4701E1464690d6b71E2Fb3AF9c4c1acab1') as `0x${string}`;
  const client = createPublicClient({ transport: http(rpc) });

  try {
    const result = await client.readContract({
      address: reader,
      abi: CRAZY_OCTAGON_READER_ABI,
      functionName: 'getBurnInfo',
      args: [102n],
    });

    console.log(JSON.stringify(stringify(result), null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ERROR', message);
    process.exit(1);
  }
}

main();
