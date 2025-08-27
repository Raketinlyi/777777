import { NextResponse } from 'next/server';
import ledgerData from '@/data/ledger.json';
import { z } from 'zod';

// export const dynamic = 'force-dynamic'; // Disabled for static export

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
    const data = ledgerData as {
      tokens: Record<
        string,
        { status: string; player: string; waitHours: number; burnTime: number }
      >;
    };
    const now = Math.floor(Date.now() / 1000);

    const pending = Object.entries(data.tokens)
      .filter(
        ([, v]) => v.status === 'BURNED' && v.player.toLowerCase() === address
      )
      .map(([tokenId, v]) => {
        const unlockTs = v.burnTime + v.waitHours * 3600;
        const timeLeft = Math.max(0, unlockTs - now);
        return {
          tokenId,
          waitHours: v.waitHours,
          burnTime: v.burnTime,
          canClaim: timeLeft === 0,
          timeLeft,
        };
      });

    return NextResponse.json(
      { pending },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
