import 'server-only';
import { NextRequest } from 'next/server';
import { createPublicClient, http, isAddress, decodeEventLog } from 'viem';
import { monadChain } from '@/config/chains';
import { CRAZY_OCTAGON_READER_ABI } from '@/lib/abi/crazyOctagon';

type ClaimItem = {
  tokenId: string;
  owner: `0x${string}`;
  claimAt: number;
  claimed: boolean;
  totalAmount: string;
  playerAmount: string;
  poolAmount: string;
  burnedAmount: string;
  waitMinutes?: number;
};

// Simple in-memory cache
const cache = new Map<string, { ts: number; data: any }>();
const TTL_MS = 60_000;

const CORE_ADDRESS = monadChain.contracts.gameProxy.address as `0x${string}`;
const READER_ADDRESS = monadChain.contracts.reader.address as `0x${string}`;
const CORE_DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_CORE_DEPLOY_BLOCK || '1');

const burnScheduledEvent = {
  type: 'event' as const,
  name: 'BurnScheduled',
  inputs: [
    { type: 'uint256', name: 'tokenId', indexed: true },
    { type: 'address', name: 'owner', indexed: true },
    { type: 'uint256', name: 'amount', indexed: false },
    { type: 'uint256', name: 'claimAt', indexed: false },
    { type: 'uint32', name: 'waitMin', indexed: false },
  ],
};

function getRpc() {
  const urls = monadChain.rpcUrls?.default?.http || [];
  return urls[0] || process.env.NEXT_PUBLIC_MONAD_RPC || process.env.MONAD_RPC || '';
}

async function enumerateFromReader(client: any): Promise<string[]> {
  const ids: string[] = [];
  let offset = 0n;
  const MAX = 800n;
  for (let safety = 0; safety < 6000; safety++) {
    const res = await client.readContract({
      address: READER_ADDRESS,
      abi: CRAZY_OCTAGON_READER_ABI,
      functionName: 'viewGraveWindow',
      args: [offset, MAX],
    });
    const r = res as unknown as [readonly bigint[], bigint, bigint, number?];
    const part = (r?.[0] || []) as readonly bigint[];
    const total = (r?.[1] || 0n) as bigint;
    const cursor = (r?.[2] || 0n) as bigint;
    for (const id of part) ids.push(String(id));
    if (cursor === 0n || ids.length >= Number(total)) break;
    offset = cursor;
  }
  return [...new Set(ids)];
}

async function enumerateFromLogs(client: any, owner: `0x${string}`): Promise<string[]> {
  const ids: string[] = [];
  const currentBlock = await client.getBlockNumber();
  let from = CORE_DEPLOY_BLOCK;
  let chunk = 5_000n;
  while (from <= currentBlock) {
    const to = from + chunk - 1n > currentBlock ? currentBlock : from + chunk - 1n;
    try {
      const logs = await client.getLogs({
        address: CORE_ADDRESS,
        event: burnScheduledEvent,
        args: { owner },
        fromBlock: from,
        toBlock: to,
      });
      for (const log of logs) {
        try {
          const parsed = decodeEventLog({ abi: [burnScheduledEvent], data: log.data, topics: log.topics }) as any;
          const id = parsed?.args?.tokenId as bigint;
          ids.push(String(id));
        } catch {}
      }
      from = to + 1n;
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if ((msg.includes('range') || msg.includes('too many') || msg.includes('size')) && chunk > 500n) {
        chunk = chunk / 2n;
        continue;
      }
      throw e;
    }
  }
  return [...new Set(ids)];
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = await params;
  const addr = resolvedParams.address as `0x${string}`;
  if (!isAddress(addr)) {
    return new Response(JSON.stringify({ error: 'invalid address' }), { status: 400 });
  }
  const key = `${addr.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return new Response(JSON.stringify(hit.data), { headers: { 'content-type': 'application/json' } });
  }

  const client = createPublicClient({ chain: monadChain, transport: http(getRpc()) });

  // enumerate
  const idsReader = await enumerateFromReader(client);
  const idsLogs = await enumerateFromLogs(client, addr);
  const allIds = [...new Set([...idsReader, ...idsLogs])];

  if (allIds.length === 0) {
    const empty = { claimable: [] as ClaimItem[], pending: [] as ClaimItem[], claimed: [] as ClaimItem[] };
    cache.set(key, { ts: Date.now(), data: empty });
    return new Response(JSON.stringify(empty), { headers: { 'content-type': 'application/json' } });
  }

  // getBurnInfo for all
  const calls = allIds.map((id) => ({
    address: READER_ADDRESS,
    abi: CRAZY_OCTAGON_READER_ABI,
    functionName: 'getBurnInfo',
    args: [BigInt(id)],
  }));
  const results = await client.multicall({ contracts: calls as any, allowFailure: true });

  const now = Math.floor(Date.now() / 1000);
  const claimable: ClaimItem[] = [];
  const pending: ClaimItem[] = [];
  const claimed: ClaimItem[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r || r.status !== 'success') continue;
    const d = r.result as any;
    const owner = d[0] as `0x${string}`;
    if (owner?.toLowerCase() !== addr.toLowerCase()) continue;
    const item: ClaimItem = {
      tokenId: allIds[i] || '',
      owner,
      totalAmount: (d[1] as bigint).toString(),
      claimAt: Number(d[2] as bigint),
      // graveReleaseAt: Number(d[3] as bigint),
      claimed: Boolean(d[4]),
      waitMinutes: Number(d[5] as number),
      playerAmount: (d[6] as bigint).toString(),
      poolAmount: (d[7] as bigint).toString(),
      burnedAmount: (d[8] as bigint).toString(),
    };
    if (item.claimed) claimed.push(item);
    else if (now >= item.claimAt) claimable.push(item);
    else pending.push(item);
  }

  const data = { claimable, pending, claimed };
  cache.set(key, { ts: Date.now(), data });
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
}
