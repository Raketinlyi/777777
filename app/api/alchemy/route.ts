import { NextResponse } from 'next/server';
import { getAlchemyKey, markKeyAsFailed } from '@/lib/alchemyKey';
import { z } from 'zod';

// Security: Validate Alchemy API requests
const AlchemyRequestSchema = z.object({
  method: z
    .string()
    .max(50)
    .refine(
      method =>
        [
          'eth_getBalance',
          'eth_getCode',
          'eth_call',
          'eth_getLogs',
          'eth_getBlockByNumber',
          'eth_getTransactionByHash',
        ].includes(method),
      'Invalid method'
    ),
  params: z.array(z.any()).max(10),
  id: z.number().optional(),
  jsonrpc: z.literal('2.0').optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Security: Validate request body
    const validatedBody = AlchemyRequestSchema.parse(body);

    const key = getAlchemyKey();
    const url = `https://eth-mainnet.g.alchemy.com/v2/${key}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedBody),
    });

    if (!res.ok) {
      markKeyAsFailed(key);
      return new NextResponse(res.statusText, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Alchemy API error:', errorMessage);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
