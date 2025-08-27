import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// CSP Report schema validation
const CSPReportSchema = z
  .object({
    'csp-report': z
      .object({
        'document-uri': z.string().optional(),
        'violated-directive': z.string().optional(),
        'original-policy': z.string().optional(),
        'blocked-uri': z.string().optional(),
        'source-file': z.string().optional(),
        'line-number': z.number().optional(),
        'column-number': z.number().optional(),
      })
      .optional(),
  })
  .optional();

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1';

    // Simple in-memory rate limiting for CSP reports
    const now = Date.now();
    const key = `csp_reports_${ip}`;
    const lastReport = parseInt(localStorage.getItem(key) || '0');

    // Allow max 10 reports per minute per IP
    if (now - lastReport < 6000) {
      return new NextResponse(null, { status: 429 });
    }

    localStorage.setItem(key, now.toString());

    // Validate request body
    const body = await req.json();
    const validatedBody = CSPReportSchema.parse(body);

    // Log only valid CSP violations
    if (validatedBody && validatedBody['csp-report']) {
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse(null, { status: 400 });
  }
}
