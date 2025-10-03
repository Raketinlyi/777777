import { NextRequest, NextResponse } from 'next/server';
import { handleCSPReport } from '@/utils/csp-monitor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Handle CSP violation report
    handleCSPReport(body, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('CSP report error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to process CSP report' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'CSP Report endpoint - POST only' },
    { status: 405 }
  );
}
