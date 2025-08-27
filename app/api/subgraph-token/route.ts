import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fetchWithRetry } from '../../../utils/fetchWithRetry';
import { z } from 'zod';

// URL for token subgraph (moni)
const SUBGRAPH_URL =
  process.env.SUBGRAPH_URL_TOKEN ||
  'https://api.studio.thegraph.com/query/111010/moni/v0.0.1';
const TTL = 120; // 2-minute caching

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
    const body = await req.text();

    // Check size limit
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

    // Security checks
    const query = validatedBody.query.toLowerCase();
    if (
      query.includes('mutation') ||
      query.includes('subscription') ||
      query.includes('__schema') ||
      query.includes('introspection')
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Operation not allowed' }),
        {
          status: 403,
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
      JSON.stringify({ error: 'Failed to fetch data from token subgraph' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
