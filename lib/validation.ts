// Comprehensive input validation system for security

import { z } from 'zod';

// Validation schemas for API endpoints
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format',
});

export const tokenIdSchema = z.string().regex(/^\d+$/, {
  message: 'Token ID must be a number',
});

export const chainIdSchema = z.number().int().positive();

export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const nftQuerySchema = z.object({
  owner: addressSchema,
  pageKey: z.string().optional(),
  ...paginationSchema.shape,
});

export const securityActionSchema = z.object({
  action: z.enum(['block_ip', 'unblock_ip', 'get_events', 'cleanup']),
  data: z.object({
    ip: z.string().ip().optional(),
    reason: z.string().optional(),
    duration: z.number().int().positive().optional(),
    minutes: z.number().int().positive().optional(),
  }),
});

// Validation functions
export function validateAddress(address: string): boolean {
  return addressSchema.safeParse(address).success;
}

export function validateTokenId(tokenId: string): boolean {
  return tokenIdSchema.safeParse(tokenId).success;
}

export function validateChainId(chainId: number): boolean {
  return chainIdSchema.safeParse(chainId).success;
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.replace(/[<>\"'&]/g, '');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>];
    }
  }
  return sanitized;
}

// Rate limiting validation
export function validateRateLimit(
  ip: string,
  action: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  // This would integrate with your rate limiting system
  return true;
}

// CSRF token validation
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken;
}

// Input sanitization for SQL injection prevention
export function sanitizeSQLInput(input: string): string {
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// XSS prevention
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
});

export function validateFileUpload(file: {
  filename: string;
  mimetype: string;
  size: number;
}): boolean {
  return fileUploadSchema.safeParse(file).success;
}

// Allowed file types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/json',
  'text/plain',
];

export function isAllowedMimeType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

// Request validation middleware
export function createValidationMiddleware(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body || req.query);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
}
