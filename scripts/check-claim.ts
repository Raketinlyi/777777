import 'dotenv/config';
import { createPublicClient, http } from 'viem';
import { monadChain } from '../config/chains.ts';
import { CRAZY_OCTAGON_CORE_ABI } from '../lib/abi/crazyOctagon.ts';

const CORE = process.env.NEXT_PUBLIC_CORE_PROXY as `0x${string}`;
const RPC = process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC || '';

async function main() {
  const tokenIdArg = process.argv[2];
  const addressArg = process.argv[3];
  if (!tokenIdArg || !addressArg) {
    console.error('Usage: npx ts-node --esm scripts/check-claim.ts <tokenId> <address>');
    process.exit(1);
  }
  const tokenId = BigInt(tokenIdArg);
  const account = addressArg as `0x${string}`;
  if (!RPC || !CORE) {
    console.error('Missing RPC or CORE env');
    process.exit(1);
  }

  const client = createPublicClient({ chain: monadChain, transport: http(RPC) });

  console.log('Simulating claimBurnRewards for token', tokenId.toString(), 'from', account);
  try {
    const { request } = await client.simulateContract({
      address: CORE,
  abi: CRAZY_OCTAGON_CORE_ABI,
      functionName: 'claimBurnRewards',
      args: [tokenId],
      account,
    });
    console.log('Simulation succeeded. tx data:', request);
  } catch (err: any) {
    console.error('Simulation failed:', err?.shortMessage || err?.message || err);
  }
}

main();


