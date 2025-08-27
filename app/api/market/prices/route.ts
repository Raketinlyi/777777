import { NextResponse } from 'next/server';
import { fetchMarketData } from '@/lib/market';
import securityLogger from '@/utils/security-logger';

export const revalidate = 180; // seconds

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Log API access for security monitoring
    securityLogger.logSuspiciousActivity(
      ip,
      'Market prices API accessed',
      { endpoint: '/api/market/prices' },
      userAgent,
      '/api/market/prices'
    );

    const data = await fetchMarketData();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=180',
        'X-API-Version': '1.0',
      },
    });
  } catch (error: unknown) {
    // Log the error for debugging
    // Log security event
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    securityLogger.logSuspiciousActivity(
      ip,
      'Market prices API error',
      { error: errorMessage, stack },
      userAgent,
      '/api/market/prices'
    );

    // Return fallback data instead of error
    return NextResponse.json(
      {
        floorApe: 0.25,
        craaUsd: 0.0000006,
        apeUsd: 1.2,
        floorCraa: 500,
        floorUsd: 0.3,
        error: 'Market data temporarily unavailable',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200, // Return 200 instead of 500 to prevent frontend crashes
        headers: {
          'Cache-Control': 'public, max-age=60', // Shorter cache for error responses
          'X-API-Version': '1.0',
        },
      }
    );
  }
}
