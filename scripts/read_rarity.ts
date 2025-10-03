import { createPublicClient, http } from 'viem';
import { monadChain } from '@/config/chains';

const CORE = process.env.NEXT_PUBLIC_CORE_PROXY as `0x${string}`;
const TOKEN_ID = BigInt(process.env.NEXT_PUBLIC_DEBUG_TOKEN_ID || '1');

const ABI = [
  {
    name: 'meta',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'rarity', type: 'uint8' },
      { name: 'initialStars', type: 'uint8' },
      { name: 'gender', type: 'uint8' },
      { name: 'isActivated', type: 'bool' }
    ]
  },
  {
    name: 'rarityBonusBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'rarity', type: 'uint8' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

async function main() {
  const rpc = monadChain.rpcUrls.default.http[0];
  if (!rpc) throw new Error('RPC not configured');
  if (!CORE) throw new Error('NEXT_PUBLIC_CORE_PROXY not set');

  const client = createPublicClient({ chain: monadChain, transport: http(rpc) });

  const meta = await client.readContract({ address: CORE, abi: ABI, functionName: 'meta', args: [TOKEN_ID] });
  const rarity = Number((meta as any)[0]);
  const rBps = await client.readContract({ address: CORE, abi: ABI, functionName: 'rarityBonusBps', args: [rarity] });
  console.log(JSON.stringify({ tokenId: TOKEN_ID.toString(), rarity, rarityBonusBps: (rBps as bigint).toString(), percent: Number(rBps)/100 }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
