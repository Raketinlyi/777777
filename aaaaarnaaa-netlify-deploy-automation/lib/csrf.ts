import crypto from 'crypto';
import React from 'react';

// CSRF token management
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

  // Generate a new CSRF token
  static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const expires = Date.now() + this.TOKEN_EXPIRY;

    this.tokens.set(sessionId, { token, expires });

    // Clean up expired tokens
    this.cleanup();

    return token;
  }

  // Validate a CSRF token
  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  // Invalidate a CSRF token
  static invalidateToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  // Clean up expired tokens
  private static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }

  // Get token for a session
  static getToken(sessionId: string): string | null {
    const stored = this.tokens.get(sessionId);
    if (!stored || Date.now() > stored.expires) {
      return null;
    }
    return stored.token;
  }

  // Check if token exists and is valid
  static hasValidToken(sessionId: string): boolean {
    const stored = this.tokens.get(sessionId);
    return stored ? Date.now() <= stored.expires : false;
  }
}

// CSRF middleware for API routes
export function csrfMiddleware(req: any, res: any, next: any) {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  const csrfToken = req.headers['x-csrf-token'] || req.body?.csrfToken;

  if (!sessionId) {
    return res.status(401).json({ error: 'Session ID required' });
  }

  if (!csrfToken) {
    return res.status(403).json({ error: 'CSRF token required' });
  }

  if (!CSRFProtection.validateToken(sessionId, csrfToken)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

// Generate CSRF token for forms
export function generateCSRFToken(sessionId: string): string {
  return CSRFProtection.generateToken(sessionId);
}

// Validate CSRF token
export function validateCSRFToken(sessionId: string, token: string): boolean {
  return CSRFProtection.validateToken(sessionId, token);
}

// React hook for CSRF protection
export function useCSRF(sessionId: string) {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionId) {
      const newToken = generateCSRFToken(sessionId);
      setToken(newToken);
    }
  }, [sessionId]);

  return token;
}

// CSRF protected fetch wrapper
export async function csrfFetch(
  url: string,
  options: RequestInit & { sessionId?: string } = {}
): Promise<Response> {
  const { sessionId, ...fetchOptions } = options;

  if (sessionId) {
    const token = CSRFProtection.getToken(sessionId);
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'X-CSRF-Token': token,
        'X-Session-ID': sessionId,
      };
    }
  }

  return fetch(url, fetchOptions);
}

// CSRF protected form submission
export function createCSRFProtectedForm(
  sessionId: string,
  onSubmit: (formData: FormData) => void
) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const token = CSRFProtection.getToken(sessionId);
    
    if (token) {
      formData.append('csrfToken', token);
    }
    
    onSubmit(formData);
  };
}

export default CSRFProtection; 