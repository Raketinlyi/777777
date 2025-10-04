import crypto from 'crypto';
import { NextRequest } from 'next/server';

type AdminAuthFailureReason = 'not_configured' | 'missing' | 'mismatch' | null;

type AdminAuthEvaluation = {
  authorized: boolean;
  tokenConfigured: boolean;
  failureReason: AdminAuthFailureReason;
};

const ADMIN_HEADER = 'x-security-token';

const getConfiguredToken = (): string | null => {
  const token = process.env.SECURITY_ADMIN_TOKEN;
  return token ? token.trim() : null;
};

const getBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
};

const constantTimeEqual = (expected: string, received: string) => {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

const getProvidedToken = (req: NextRequest): string | null => {
  const headerToken = req.headers.get(ADMIN_HEADER)?.trim();
  const bearerToken = getBearerToken(req.headers.get('authorization'));
  return headerToken || bearerToken || null;
};

export const extractClientIp = (req: NextRequest): string =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip')?.trim() ||
  req.headers.get('cf-connecting-ip')?.trim() ||
  'unknown';

export const evaluateAdminRequest = (
  req: NextRequest
): AdminAuthEvaluation => {
  const configuredToken = getConfiguredToken();

  if (!configuredToken) {
    return {
      authorized: false,
      tokenConfigured: false,
      failureReason: 'not_configured',
    };
  }

  const providedToken = getProvidedToken(req);

  if (!providedToken) {
    return {
      authorized: false,
      tokenConfigured: true,
      failureReason: 'missing',
    };
  }

  const authorized = constantTimeEqual(configuredToken, providedToken);

  return {
    authorized,
    tokenConfigured: true,
    failureReason: authorized ? null : 'mismatch',
  };
};
