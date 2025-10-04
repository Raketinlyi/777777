'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { CRAZY_OCTAGON_READER_ABI } from '@/lib/abi/crazyOctagon';
import { monadChain } from '@/config/chains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface GraveTokenInfo {
  tokenId: string;
  owner: string;
  claimAt: number;
  claimed: boolean;
  isOwnerMatch: boolean;
}

export function ClaimDebug() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [graveInfo, setGraveInfo] = useState<GraveTokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const READER_ADDR = (monadChain.contracts.reader?.address ??
    monadChain.contracts.lpManager?.address ??
    monadChain.contracts.gameProxy!.address) as `0x${string}`;

  useEffect(() => {
    const fetchGraveInfo = async () => {
      if (!publicClient || !isConnected) {
        setGraveInfo([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch all token IDs from the graveyard
        const first = (await publicClient.readContract({
          address: READER_ADDR,
          abi: CRAZY_OCTAGON_READER_ABI,
          functionName: 'viewGraveWindow',
          args: [0n, 50n],
        })) as readonly unknown[];
        
        const total = Number((first[1] as bigint) ?? 0n);
        const initial = Array.isArray(first[0]) ? (first[0] as bigint[]).map(x => x.toString()) : [];
        const max = Math.min(total, 200); // Limit to 200 for performance
        let ids: string[] = initial.slice(0, max);
        let offset = ids.length;

        while (offset < max) {
          const remain = max - offset;
          if (remain <= 0) break;
          const size = Math.min(remain, 50);
          const win = (await publicClient.readContract({
            address: READER_ADDR,
            abi: CRAZY_OCTAGON_READER_ABI,
            functionName: 'viewGraveWindow',
            args: [BigInt(offset), BigInt(size)],
          })) as readonly unknown[];
          const chunk = Array.isArray(win[0]) ? (win[0] as bigint[]).map(x => x.toString()) : [];
          if (chunk.length === 0) break;
          ids.push(...chunk);
          if (ids.length > max) ids = ids.slice(0, max);
          offset = ids.length;
        }

        // 2. For each ID, get its burn info
        type BurnInfoTuple = readonly [
          `0x${string}`,
          bigint,
          bigint,
          bigint,
          boolean,
          number,
          bigint,
          bigint,
          bigint
        ];

        const infoPromises = ids.map(async (id) => {
          const info = (await publicClient.readContract({
            address: READER_ADDR,
            abi: CRAZY_OCTAGON_READER_ABI,
            functionName: 'getBurnInfo',
            args: [BigInt(id)],
          })) as BurnInfoTuple;

          const owner = info[0].toLowerCase();
          const connectedAddress = address?.toLowerCase();

          return {
            tokenId: id,
            owner: info[0],
            claimAt: Number(info[2]),
            claimed: info[4],
            isOwnerMatch: owner === connectedAddress,
          };
        });

        const results = await Promise.all(infoPromises);
        setGraveInfo(results);

      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchGraveInfo();
  }, [publicClient, address, isConnected, READER_ADDR]);

  return (
    <Card className="mt-8 bg-black/20 border-yellow-500/30">
      <CardHeader>
        <CardTitle className="text-yellow-300">Claim Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-slate-300">Connected Wallet Address:</p>
          <p className="font-mono text-lg text-white">{address ?? 'Not Connected'}</p>
        </div>

        {loading && <p className="text-yellow-200">Loading graveyard data...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-slate-300">Token ID</TableHead>
              <TableHead className="text-slate-300">Burner Address (from contract)</TableHead>
              <TableHead className="text-slate-300">Claimable</TableHead>
              <TableHead className="text-slate-300">Claimed</TableHead>
              <TableHead className="text-slate-300">Owner Match?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {graveInfo.map((info) => (
              <TableRow key={info.tokenId}>
                <TableCell className="font-mono text-white">{info.tokenId}</TableCell>
                <TableCell className="font-mono text-white">{info.owner}</TableCell>
                <TableCell className="text-white">{new Date(info.claimAt * 1000) < new Date() ? 'Yes' : 'No'}</TableCell>
                <TableCell>{info.claimed ? <Badge variant="destructive">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                <TableCell>{info.isOwnerMatch ? <Badge className="bg-green-500">Yes</Badge> : <Badge variant="destructive">No</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {graveInfo.length === 0 && !loading && <p className="text-center text-slate-400 py-4">No tokens found in graveyard.</p>}
      </CardContent>
    </Card>
  );
}