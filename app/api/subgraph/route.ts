import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fetchWithRetry } from '../../../utils/fetchWithRetry';
import { z } from 'zod';

// URL for NFT subgraph (denis)
const SUBGRAPH_URL =
  process.env.SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/111010/denis-3/v0.0.1';
const TTL = 120; // 2-minute caching (≈ 30 requests/h)

// In-memory cache
const memoryCache: Record<string, { ts: number; data: string }> = {};

// GraphQL query validation schema
const GraphQLSchema = z.object({
  query: z.string().max(10000), // Max 10KB query
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Read body only once
    const body = await req.text();

    // Check size after reading
    const MAX_SIZE = 1_000_000; // 1 MB
    if (body.length > MAX_SIZE) {
      return new NextResponse(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Validate GraphQL query
    const parsedBody = JSON.parse(body);
    const validatedBody = GraphQLSchema.parse(parsedBody);

    // Additional security checks
    const query = validatedBody.query.toLowerCase();

    // Basic GraphQL query validation
    const { parse } = await import('graphql');

    try {
      const document = parse(validatedBody.query);
      // Basic validation passed - document is valid GraphQL
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid GraphQL query' }),
        {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
    const cacheKey = crypto.createHash('sha1').update(body).digest('hex');

    const entry = memoryCache[cacheKey];
    const now = Date.now();
    if (entry && now - entry.ts < TTL * 1000) {
      return new NextResponse(entry.data, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-cache': 'HIT',
        },
      });
    }

    const sgRes = await fetchWithRetry(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const text = await sgRes.text();
    // simple LRU cap 500
    if (Object.keys(memoryCache).length > 500) {
      const oldest = Object.entries(memoryCache).sort(
        (a, b) => a[1].ts - b[1].ts
      )[0];
      if (oldest) delete memoryCache[oldest[0]];
    }
    memoryCache[cacheKey] = { ts: now, data: text };

    return new NextResponse(text, {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-cache': 'MISS',
      },
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch data from subgraph' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
