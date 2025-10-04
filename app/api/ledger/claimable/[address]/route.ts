import { NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { monadChain } from '@/config/chains';
import { CRAZY_OCTAGON_READER_ABI } from '@/lib/abi/crazyOctagon';
import { z } from 'zod';

// Use Reader contract for burn data
const READER_ADDRESS = monadChain.contracts.reader.address;
const CORE_ADDRESS = monadChain.contracts.gameProxy.address;

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

// Simple in-memory cache to avoid repeated heavy scans
const CACHE_TTL_MS = Number(process.env.CLAIMABLE_CACHE_TTL_MS || '60000');
const PENDING_CACHE = new Map<string, { ts: number; data: unknown }>();

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const resolvedParams = await params;
  const address = resolvedParams.address?.toLowerCase();
  if (!address)
    return NextResponse.json({ error: 'address missing' }, { status: 400 });

  const addrSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
  if (!addrSchema.safeParse(address).success) {
    return NextResponse.json({ error: 'invalid address' }, { status: 400 });
  }

  try {
    const client = createPublicClient({ chain: monadChain, transport: http() });
    const now = Math.floor(Date.now() / 1000);

    // Return cached if fresh
    const cached = PENDING_CACHE.get(address);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json({ pending: cached.data });
    }

    // 1) Enumerate grave window (Reader) to collect token ids in grave
    const tokenIds: string[] = [];
    try {
      let offset = 0n;
      const MAX = 600n;
      for (let loop = 0; loop < 1000; loop++) {
        const res = await client.readContract({
          address: READER_ADDRESS,
          abi: CRAZY_OCTAGON_READER_ABI,
          functionName: 'viewGraveWindow',
          args: [offset, MAX],
        });
        const arr = res as unknown as [readonly bigint[], bigint, bigint, number?];
        const part = Array.isArray(arr?.[0]) ? (arr[0] as readonly bigint[]) : [];
        const cursor = (arr?.[2] ?? 0n) as bigint;
        for (const id of part) tokenIds.push(String(id));
        if (cursor === 0n) break;
        offset = cursor;
      }
    } catch {
      // ignore reader enumeration errors
    }

    // 2) If reader didn't find anything relevant, or to supplement, scan logs for BurnScheduled by owner
    try {
      const currentBlock = await client.getBlockNumber();
      const fromBlock = BigInt(Number(process.env.NEXT_PUBLIC_CORE_DEPLOY_BLOCK || '1')) || 1n;
      let size = 5_000n;
      let from = fromBlock;
      while (from <= currentBlock) {
        const to = from + size - 1n > currentBlock ? currentBlock : from + size - 1n;
        try {
          const logs = await client.getLogs({
            address: CORE_ADDRESS,
            event: burnScheduledEvent,
            args: { owner: address as `0x${string}` },
            fromBlock: from,
            toBlock: to,
          });
          for (const log of logs) {
            try {
              const parsed = decodeEventLog({ abi: [burnScheduledEvent], data: log.data, topics: log.topics }) as any;
              const id = parsed?.args?.tokenId as bigint;
              tokenIds.push(String(id));
            } catch {
              // ignore parse errors
            }
          }
          from = to + 1n;
        } catch (e) {
          const msg = String((e as unknown as { message?: string })?.message || '').toLowerCase();
          if ((msg.includes('block range') || msg.includes('size') || msg.includes('too many')) && size > 500n) {
            size = size / 2n;
            continue;
          }
          // break on unknown error to avoid endless loop
          break;
        }
      }
    } catch {
      // ignore getLogs top-level errors
    }

    const uniqueIds = Array.from(new Set(tokenIds));
    const pending: unknown[] = [];

    // 3) For all collected ids, call getBurnInfo and pick those owned by address
    if (uniqueIds.length > 0) {
      const calls = uniqueIds.map((id) => ({ address: READER_ADDRESS, abi: CRAZY_OCTAGON_READER_ABI, functionName: 'getBurnInfo', args: [BigInt(id)] }));
      const multicall = await client.multicall({ contracts: calls, allowFailure: true }).catch(() => null);
      if (Array.isArray(multicall)) {
        for (let i = 0; i < multicall.length; i++) {
          const r = multicall[i];
          if (!r || r.status !== 'success') continue;
          const data = r.result as unknown as [string, bigint, bigint, bigint, boolean, number, bigint, bigint, bigint];
          const owner = (data[0] || '').toLowerCase();
          if (owner !== address) continue;
          const totalAmount = data[1];
          const claimAt = data[2];
          const claimed = Boolean(data[4]);
          const waitMinutes = Number(data[5]);
          pending.push({
            tokenId: uniqueIds[i],
            waitHours: Math.floor(waitMinutes / 60),
            burnTime: Number(claimAt) - (waitMinutes * 60),
            canClaim: !claimed && Number(claimAt) <= now,
            timeLeft: Math.max(0, Number(claimAt) - now),
            totalAmount: totalAmount.toString(),
            claimed,
          });
        }
      }
    }

    // cache result
    PENDING_CACHE.set(address, { ts: Date.now(), data: pending });
    return NextResponse.json({ pending }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
