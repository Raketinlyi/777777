import { NextResponse } from 'next/server';
import ledgerData from '@/data/ledger.json';

// export const dynamic = 'force-dynamic'; // Disabled for static export

export async function GET() {
  try {
    const data = ledgerData as { tokens: Record<string, { status: string }> };
    const tokens = Object.entries(data.tokens)
      .filter(([, v]) => v.status === 'BURNED')
      .map(([id]) => id);

    return NextResponse.json(
      { tokens },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
        status: 200,
      }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
