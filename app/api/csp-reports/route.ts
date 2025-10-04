import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import securityLogger from '@/utils/security-logger';
import { extractClientIp } from '@/utils/security-admin-auth';

// CSP Report schema validation
const CspViolationSchema = z
  .object({
    'document-uri': z.string().optional(),
    'violated-directive': z.string().optional(),
    'original-policy': z.string().optional(),
    'blocked-uri': z.string().optional(),
    'source-file': z.string().optional(),
    'line-number': z.number().optional(),
    'column-number': z.number().optional(),
  })
  .strict()
  .optional();

const CspReportSchema = z
  .object({
    'csp-report': CspViolationSchema,
  })
  .optional();

type CspViolation = Exclude<z.infer<typeof CspViolationSchema>, undefined>;

const REPORT_WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 10;
const reportBuckets = new Map<
  string,
  { count: number; windowStart: number }
>();

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const bucket = reportBuckets.get(ip);

  if (!bucket) {
    reportBuckets.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (now - bucket.windowStart > REPORT_WINDOW_MS) {
    reportBuckets.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (bucket.count >= MAX_REPORTS_PER_WINDOW) {
    bucket.count += 1;
    return true;
  }

  bucket.count += 1;
  return false;
};

const logCspViolation = (
  ip: string,
  report: CspViolation | undefined,
  userAgent?: string | null
) => {
  if (!report) {
    return;
  }

  securityLogger.logSuspiciousActivity(
    ip,
    'csp_violation_reported',
    {
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      documentUri: report['document-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
    },
    userAgent || undefined,
    report['document-uri']
  );
};

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);
  const userAgent = req.headers.get('user-agent');

  if (isRateLimited(ip)) {
    securityLogger.logRateLimitViolation(
      ip,
      MAX_REPORTS_PER_WINDOW,
      `${REPORT_WINDOW_MS / 1000}s`,
      userAgent || undefined,
      req.nextUrl.pathname
    );
    return new NextResponse(null, { status: 429 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    securityLogger.logSuspiciousActivity(
      ip,
      'csp_report_invalid_json',
      {},
      userAgent || undefined,
      req.nextUrl.pathname
    );
    return new NextResponse(null, { status: 400 });
  }

  const parsed = CspReportSchema.safeParse(bodyJson);

  if (!parsed.success) {
    securityLogger.logSuspiciousActivity(
      ip,
      'csp_report_schema_validation_failed',
      {
        issues: parsed.error.issues.map((issue: z.ZodIssue) => issue.message),
      },
      userAgent || undefined,
      req.nextUrl.pathname
    );
    return new NextResponse(null, { status: 400 });
  }

  const report = parsed.data?.['csp-report'];
  logCspViolation(ip, report, userAgent);

  return new NextResponse(null, { status: 204 });
}
