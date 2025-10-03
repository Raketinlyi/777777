// CSP Monitoring Utility
// Tracks Content Security Policy violations for security analysis

interface CSPViolation {
  timestamp: number;
  ip: string;
  userAgent: string;
  blockedUri: string;
  violatedDirective: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

class CSPMonitor {
  private violations: CSPViolation[] = [];
  private maxViolations = 1000; // Keep last 1000 violations

  logViolation(violation: Omit<CSPViolation, 'timestamp'>) {
    const fullViolation: CSPViolation = {
      ...violation,
      timestamp: Date.now(),
    };

    this.violations.push(fullViolation);

    // Keep only the last maxViolations
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      // Удаляем console.warn для production безопасностиq
      // console.warn('CSP Violation:', fullViolation);
    } else if (process.env.NODE_ENV === 'production') {
      // Log to external service in production
      if (process.env.CSP_LOGGING_ENDPOINT) {
        try {
          fetch(process.env.CSP_LOGGING_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              violation: fullViolation,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href,
            }),
          });
        } catch (err) {
          // Удаляем console.error для production безопасности
          // console.error('Failed to send CSP violation to logging service:', err);
        }
      }
    }
  }

  getViolations(limit = 50): CSPViolation[] {
    return this.violations.slice(-limit);
  }

  getViolationsByIP(ip: string, limit = 20): CSPViolation[] {
    return this.violations.filter(v => v.ip === ip).slice(-limit);
  }

  getViolationsByDirective(directive: string, limit = 20): CSPViolation[] {
    return this.violations
      .filter(v => v.violatedDirective === directive)
      .slice(-limit);
  }

  getStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentViolations = this.violations.filter(
      v => v.timestamp > oneHourAgo
    );
    const dailyViolations = this.violations.filter(
      v => v.timestamp > oneDayAgo
    );

    const directiveStats = this.violations.reduce(
      (acc, v) => {
        acc[v.violatedDirective] = (acc[v.violatedDirective] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const ipStats = this.violations.reduce(
      (acc, v) => {
        acc[v.ip] = (acc[v.ip] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: this.violations.length,
      lastHour: recentViolations.length,
      lastDay: dailyViolations.length,
      topDirectives: Object.entries(directiveStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      topIPs: Object.entries(ipStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    };
  }

  clear() {
    this.violations = [];
  }

  private sendToLoggingService(violation: CSPViolation) {
    // Example implementation for external logging
    // You can integrate with services like:
    // - Sentry
    // - LogRocket
    // - Custom logging endpoint

    if (process.env.CSP_LOGGING_ENDPOINT) {
      fetch(process.env.CSP_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(violation),
      }).catch(err => {
        // Safe error handling for production
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to send CSP violation to logging service:', err);
        }
      });
    }
  }
}

// Export singleton instance
export const cspMonitor = new CSPMonitor();

// Helper function to parse CSP violation reports
export function parseCSPViolation(
  body: any
): Omit<CSPViolation, 'timestamp'> | null {
  try {
    const report = typeof body === 'string' ? JSON.parse(body) : body;

    if (!report['csp-report']) {
      return null;
    }

    const cspReport = report['csp-report'];

    const result: Omit<CSPViolation, 'timestamp'> = {
      ip: report.ip || 'unknown',
      userAgent: report.userAgent || 'unknown',
      blockedUri: cspReport['blocked-uri'] || 'unknown',
      violatedDirective: cspReport['violated-directive'] || 'unknown',
      sourceFile: cspReport['source-file'],
    };

    if (cspReport['line-number']) {
      result.lineNumber = parseInt(cspReport['line-number']);
    }

    if (cspReport['column-number']) {
      result.columnNumber = parseInt(cspReport['column-number']);
    }

    return result;
  } catch (error) {
    // Удаляем console.error для production безопасности
    // console.error('Failed to parse CSP violation:', error);
    return null;
  }
}

// CSP Report endpoint handler
export function handleCSPReport(body: any, ip: string, userAgent: string) {
  const violation = parseCSPViolation(body);

  if (violation) {
    // Override IP and user agent from request headers
    violation.ip = ip;
    violation.userAgent = userAgent;

    cspMonitor.logViolation(violation);
  }
}
