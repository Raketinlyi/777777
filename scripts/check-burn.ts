import 'dotenv/config';
import { createPublicClient, http, formatEther } from 'viem';
import { defineChain } from 'viem';
import {
  CRAZY_OCTAGON_CORE_ABI,
  CRAZY_OCTAGON_READER_ABI,
} from '../lib/abi/crazyOctagon.ts';

const RPC = process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC || '';
const CORE = (process.env.NEXT_PUBLIC_CORE_PROXY || process.env.CORE_PROXY) as `0x${string}`;
const READER = (process.env.NEXT_PUBLIC_READER_ADDRESS || process.env.READER) as `0x${string}`;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || process.env.MONAD_CHAIN_ID || '10143');

const monadTestnet = defineChain({
  id: CHAIN_ID,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
});

async function main() {
  const tokenIdArg = process.argv[2];
  if (!tokenIdArg) {
    console.error('Usage: ts-node scripts/check-burn.ts <tokenId>');
    process.exit(1);
  }
  const tokenId = BigInt(tokenIdArg);
  if (!RPC || !CORE || !READER) {
    console.error('Missing RPC/CORE/READER in env');
    process.exit(1);
  }
  const client = createPublicClient({ chain: monadTestnet, transport: http(RPC) });

  console.log('RPC:', RPC);
  console.log('CORE:', CORE);
  console.log('READER:', READER);
  console.log('tokenId:', tokenId.toString());

  try {
    const burns = await client.readContract({ address: CORE, abi: CRAZY_OCTAGON_CORE_ABI, functionName: 'burns', args: [tokenId] });
    const [owner, totalAmount, claimAt, graveReleaseAt, claimed, waitMinutes] = burns as unknown as [
      `0x${string}`, bigint, bigint, bigint, boolean, number
    ];
    console.log('Core.burns =>', { owner, totalAmount: totalAmount.toString(), claimAt: Number(claimAt), graveReleaseAt: Number(graveReleaseAt), claimed, waitMinutes });
  } catch (e) {
    console.log('Core.burns error:', (e as Error).message);
  }

  try {
    const info = await client.readContract({ address: READER, abi: CRAZY_OCTAGON_READER_ABI, functionName: 'getBurnInfo', args: [tokenId] });
    const [owner, totalAmount, claimAt, graveReleaseAt, claimed, waitMinutes, playerAmount, poolAmount, burnedAmount] = info as unknown as [
      `0x${string}`, bigint, bigint, bigint, boolean, number, bigint, bigint, bigint
    ];
    console.log('Reader.getBurnInfo =>', { owner, totalAmount: totalAmount.toString(), claimAt: Number(claimAt), graveReleaseAt: Number(graveReleaseAt), claimed, waitMinutes, playerAmount: playerAmount.toString(), poolAmount: poolAmount.toString(), burnedAmount: burnedAmount.toString() });
    console.log('Preview OCTA =>', { player: formatEther(playerAmount), pool: formatEther(poolAmount), burned: formatEther(burnedAmount) });
  } catch (e) {
    console.log('Reader.getBurnInfo error:', (e as Error).message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
