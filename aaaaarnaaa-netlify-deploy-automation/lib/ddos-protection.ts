// DDoS Protection System
interface DDoSStats {
  requests: number;
  lastRequest: number;
  blocked: boolean;
  blockUntil: number;
}

class DDoSProtection {
  private static ipStats = new Map<string, DDoSStats>();
  private static readonly MAX_REQUESTS_PER_MINUTE = 100;
  private static readonly MAX_REQUESTS_PER_SECOND = 10;
  private static readonly BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  // Check if IP is allowed to make requests
  static isAllowed(ip: string): boolean {
    const now = Date.now();
    const stats = this.ipStats.get(ip) || {
      requests: 0,
      lastRequest: now,
      blocked: false,
      blockUntil: 0,
    };

    // Check if IP is blocked
    if (stats.blocked && now < stats.blockUntil) {
      return false;
    }

    // Reset block if expired
    if (stats.blocked && now >= stats.blockUntil) {
      stats.blocked = false;
      stats.requests = 0;
    }

    // Check rate limits
    const timeDiff = now - stats.lastRequest;
    
    // Per-second limit
    if (timeDiff < 1000 && stats.requests >= this.MAX_REQUESTS_PER_SECOND) {
      this.blockIP(ip, 'Rate limit exceeded (per second)');
      return false;
    }

    // Per-minute limit
    if (timeDiff < 60000 && stats.requests >= this.MAX_REQUESTS_PER_MINUTE) {
      this.blockIP(ip, 'Rate limit exceeded (per minute)');
      return false;
    }

    // Reset counter if more than 1 minute has passed
    if (timeDiff >= 60000) {
      stats.requests = 0;
    }

    // Update stats
    stats.requests++;
    stats.lastRequest = now;
    this.ipStats.set(ip, stats);

    return true;
  }

  // Block an IP address
  private static blockIP(ip: string, reason: string): void {
    const stats = this.ipStats.get(ip) || {
      requests: 0,
      lastRequest: Date.now(),
      blocked: false,
      blockUntil: 0,
    };

    stats.blocked = true;
    stats.blockUntil = Date.now() + this.BLOCK_DURATION;
    this.ipStats.set(ip, stats);

    // Удаляем console.error для production безопасностиq
    // console.error(`🚫 DDoS Protection: Blocked IP ${ip} - ${reason} for ${this.BLOCK_DURATION / 1000 / 60} minutes`);
  }

  // Get DDoS statistics
  static getStats(): {
    totalIPs: number;
    blockedIPs: number;
    totalRequests: number;
  } {
    const now = Date.now();
    let blockedCount = 0;
    let totalRequests = 0;

    for (const stats of this.ipStats.values()) {
      if (stats.blocked && now < stats.blockUntil) {
        blockedCount++;
      }
      totalRequests += stats.requests;
    }

    return {
      totalIPs: this.ipStats.size,
      blockedIPs: blockedCount,
      totalRequests,
    };
  }

  // Clean up old entries
  static cleanup(): void {
    const now = Date.now();
    const cutoff = now - 60 * 60 * 1000; // 1 hour

    for (const [ip, stats] of this.ipStats.entries()) {
      if (stats.lastRequest < cutoff && !stats.blocked) {
        this.ipStats.delete(ip);
      }
    }
  }

  // Get blocked IPs
  static getBlockedIPs(): string[] {
    const now = Date.now();
    const blocked: string[] = [];

    for (const [ip, stats] of this.ipStats.entries()) {
      if (stats.blocked && now < stats.blockUntil) {
        blocked.push(ip);
      }
    }

    return blocked;
  }

  // Unblock an IP
  static unblockIP(ip: string): boolean {
    const stats = this.ipStats.get(ip);
    if (stats && stats.blocked) {
      stats.blocked = false;
      stats.blockUntil = 0;
      this.ipStats.set(ip, stats);
      // Удаляем console.log для production безопасности
      // console.log(`✅ DDoS Protection: Unblocked IP ${ip}`);
      return true;
    }
    return false;
  }
}

// Initialize cleanup interval
setInterval(() => {
  DDoSProtection.cleanup();
}, 10 * 60 * 1000); // 10 minutes

// DDoS middleware for Express/Next.js
export function ddosMiddleware(req: any, res: any, next: any) {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';

  if (!DDoSProtection.isAllowed(ip)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  next();
}

// Enhanced rate limiting with DDoS protection
export class EnhancedRateLimiter {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  private static readonly WINDOW_MS = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS = 100;

  static checkLimit(ip: string): boolean {
    const now = Date.now();
    const current = this.requestCounts.get(ip);

    if (!current || now > current.resetTime) {
      this.requestCounts.set(ip, { count: 1, resetTime: now + this.WINDOW_MS });
      return true;
    }

    if (current.count >= this.MAX_REQUESTS) {
      return false;
    }

    current.count++;
    return true;
  }

  static getRemainingRequests(ip: string): number {
    const current = this.requestCounts.get(ip);
    if (!current) return this.MAX_REQUESTS;
    return Math.max(0, this.MAX_REQUESTS - current.count);
  }

  static getResetTime(ip: string): number {
    const current = this.requestCounts.get(ip);
    return current ? current.resetTime : Date.now() + this.WINDOW_MS;
  }
}

// Combined protection middleware
export function securityMiddleware(req: any, res: any, next: any) {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';

  // Check DDoS protection
  if (!DDoSProtection.isAllowed(ip)) {
    return res.status(429).json({
      error: 'DDoS protection triggered',
      message: 'Too many requests from this IP.',
    });
  }

  // Check rate limiting
  if (!EnhancedRateLimiter.checkLimit(ip)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(EnhancedRateLimiter.getResetTime(ip) / 1000),
    });
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', 100);
  res.setHeader('X-RateLimit-Remaining', EnhancedRateLimiter.getRemainingRequests(ip));
  res.setHeader('X-RateLimit-Reset', EnhancedRateLimiter.getResetTime(ip));

  next();
}

export default DDoSProtection; 