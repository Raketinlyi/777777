// Security logging system for tracking suspicious activities and attacks

export interface SecurityEvent {
  timestamp: number;
  ip: string;
  eventType:
    | 'suspicious'
    | 'attack'
    | 'rate_limit'
    | 'csrf_failure'
    | 'bot_detected';
  action: string;
  details: { [key: string]: any };
  userAgent?: string;
  path?: string;
  method?: string;
}

// In-memory storage for security events (in production, use external logging service)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000; // Keep last 1000 events

// Blocked IPs (in production, use Redis or database)
const blockedIPs = new Map<
  string,
  { reason: string; blockedAt: number; expiresAt: number }
>();

export const securityLogger = {
  // Log suspicious activity
  logSuspiciousActivity: (
    ip: string,
    action: string,
    details: { [key: string]: any },
    userAgent?: string,
    path?: string
  ) => {
    const event: SecurityEvent = {
      timestamp: Date.now(),
      ip,
      eventType: 'suspicious',
      action,
      details,
    };

    if (userAgent) {
      event.userAgent = userAgent;
    }

    if (path) {
      event.path = path;
    }

    securityEvents.push(event);
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.warn для production безопасности
      // console.warn(`🚨 SUSPICIOUS: ${ip} - ${action}`, details);
    }

    // Check if IP should be blocked
    const recentEvents = securityEvents.filter(
      e => e.ip === ip && e.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentEvents.length >= 10) {
      securityLogger.blockIP(ip, 'Too many suspicious activities');
    }
  },

  // Log attack attempts
  logAttackAttempt: (
    ip: string,
    attackType: string,
    payload: { [key: string]: any },
    userAgent?: string,
    path?: string,
    method?: string
  ) => {
    const event: SecurityEvent = {
      timestamp: Date.now(),
      ip,
      eventType: 'attack',
      action: attackType,
      details: payload,
    };

    if (userAgent) {
      event.userAgent = userAgent;
    }

    if (path) {
      event.path = path;
    }

    if (method) {
      event.method = method;
    }

    securityEvents.push(event);
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.error для production безопасности
      // console.error(`💥 ATTACK: ${ip} - ${attackType}`, payload);
    }

    // Block IP immediately for attacks
    securityLogger.blockIP(ip, `Attack attempt: ${attackType}`);
  },

  // Log rate limit violations
  logRateLimitViolation: (
    ip: string,
    limit: number,
    window: string,
    userAgent?: string,
    path?: string
  ) => {
    const event: SecurityEvent = {
      timestamp: Date.now(),
      ip,
      eventType: 'rate_limit',
      action: 'Rate limit exceeded',
      details: { limit, window },
    };

    if (userAgent) {
      event.userAgent = userAgent;
    }

    if (path) {
      event.path = path;
    }

    securityEvents.push(event);
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.warn для production безопасности
      // console.warn(
      //   `⏰ RATE_LIMIT: ${ip} exceeded ${limit} requests per ${window}`
      // );
    }
  },

  // Log CSRF failures
  logCSRFFailure: (
    ip: string,
    token: string | null,
    userAgent?: string,
    path?: string
  ) => {
    const event: SecurityEvent = {
      timestamp: Date.now(),
      ip,
      eventType: 'csrf_failure',
      action: 'CSRF token validation failed',
      details: { tokenProvided: !!token },
    };

    if (userAgent) {
      event.userAgent = userAgent;
    }

    if (path) {
      event.path = path;
    }

    securityEvents.push(event);
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.warn для production безопасности
      // console.warn(`🛡️ CSRF_FAILURE: ${ip} - Invalid CSRF token`);
    }
  },

  // Log bot detection
  logBotDetected: (ip: string, userAgent: string, path?: string) => {
    const event: SecurityEvent = {
      timestamp: Date.now(),
      ip,
      eventType: 'bot_detected',
      action: 'Bot detected',
      details: { userAgent },
      userAgent,
    };

    if (path) {
      event.path = path;
    }

    securityEvents.push(event);
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.warn для production безопасности
      // console.warn(`🤖 BOT_DETECTED: ${ip} - ${userAgent}`);
    }
  },

  // Block IP address
  blockIP: (ip: string, reason: string, durationMinutes: number = 60) => {
    const now = Date.now();
    blockedIPs.set(ip, {
      reason,
      blockedAt: now,
      expiresAt: now + durationMinutes * 60 * 1000,
    });

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.error для production безопасности
      // console.error(
      //   `🚫 IP_BLOCKED: ${ip} - ${reason} for ${durationMinutes} minutes`
      // );
    }
  },

  // Check if IP is blocked
  isIPBlocked: (ip: string): boolean => {
    const blocked = blockedIPs.get(ip);
    if (!blocked) return false;

    if (Date.now() > blocked.expiresAt) {
      blockedIPs.delete(ip);
      return false;
    }

    return true;
  },

  // Get blocked IPs
  getBlockedIPs: () => {
    const now = Date.now();
    const active = new Map<
      string,
      { reason: string; blockedAt: number; expiresAt: number }
    >();

    for (const [ip, data] of blockedIPs.entries()) {
      if (now <= data.expiresAt) {
        active.set(ip, data);
      } else {
        blockedIPs.delete(ip);
      }
    }

    return active;
  },

  // Get recent security events
  getRecentEvents: (minutes: number = 60): SecurityEvent[] => {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return securityEvents.filter(event => event.timestamp > cutoff);
  },

  // Get security statistics
  getSecurityStats: () => {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    const lastDay = now - 24 * 60 * 60 * 1000;

    const hourlyEvents = securityEvents.filter(e => e.timestamp > lastHour);
    const dailyEvents = securityEvents.filter(e => e.timestamp > lastDay);

    return {
      totalEvents: securityEvents.length,
      eventsLastHour: hourlyEvents.length,
      eventsLastDay: dailyEvents.length,
      blockedIPs: blockedIPs.size,
      suspiciousCount: hourlyEvents.filter(e => e.eventType === 'suspicious')
        .length,
      attackCount: hourlyEvents.filter(e => e.eventType === 'attack').length,
      rateLimitCount: hourlyEvents.filter(e => e.eventType === 'rate_limit')
        .length,
      csrfFailureCount: hourlyEvents.filter(e => e.eventType === 'csrf_failure')
        .length,
      botDetectedCount: hourlyEvents.filter(e => e.eventType === 'bot_detected')
        .length,
    };
  },

  // Clear old events
  cleanup: () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // Keep last 24 hours
    const oldCount = securityEvents.length;

    while (securityEvents.length > 0) {
      const firstEvent = securityEvents[0];
      if (firstEvent && firstEvent.timestamp < cutoff) {
        securityEvents.shift();
      } else {
        break;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.log для production безопасности
      // console.log(
      //   `🧹 Cleaned up ${oldCount - securityEvents.length} old security events`
      // );
    }
  },
};

// Cleanup old events every hour
setInterval(
  () => {
    securityLogger.cleanup();
  },
  60 * 60 * 1000
);

export default securityLogger;
