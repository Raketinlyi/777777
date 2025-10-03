// AI-Powered Security System for CrazyCube
// Real-time threat detection and prevention

interface SecurityEvent {
  timestamp: number;
  ip: string;
  eventType:
    | 'attack'
    | 'suspicious'
    | 'rate_limit'
    | 'csrf_failure'
    | 'bot_detected';
  action: string;
  details: { [key: string]: any };
  userAgent?: string;
  path?: string;
  method?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  aiConfidence: number;
}

interface ThreatPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  aiWeight: number;
}

class AISecuritySystem {
  private events: SecurityEvent[] = [];
  private threatPatterns: ThreatPattern[] = [];
  private blockedIPs = new Map<
    string,
    { reason: string; blockedAt: number; expiresAt: number }
  >();
  private aiModel: any = null;

  constructor() {
    this.initializeThreatPatterns();
    this.initializeAIModel();
  }

  private initializeThreatPatterns() {
    this.threatPatterns = [
      // XSS Patterns
      {
        pattern: /<script[^>]*>.*?<\/script>/is,
        severity: 'critical',
        description: 'XSS Script Injection',
        aiWeight: 0.95,
      },
      {
        pattern: /javascript:/i,
        severity: 'high',
        description: 'JavaScript Protocol Injection',
        aiWeight: 0.85,
      },
      {
        pattern: /on\w+\s*=/i,
        severity: 'high',
        description: 'Event Handler Injection',
        aiWeight: 0.8,
      },

      // SQL Injection Patterns
      {
        pattern: /union\s+select/i,
        severity: 'critical',
        description: 'SQL Union Injection',
        aiWeight: 0.95,
      },
      {
        pattern: /drop\s+table/i,
        severity: 'critical',
        description: 'SQL Drop Table',
        aiWeight: 0.9,
      },
      {
        pattern: /insert\s+into/i,
        severity: 'high',
        description: 'SQL Insert Injection',
        aiWeight: 0.75,
      },

      // Path Traversal
      {
        pattern: /\.\.\//,
        severity: 'high',
        description: 'Directory Traversal',
        aiWeight: 0.85,
      },
      {
        pattern: /\/etc\/passwd/i,
        severity: 'critical',
        description: 'System File Access',
        aiWeight: 0.95,
      },

      // Command Injection
      {
        pattern: /[;&|`$(){}[\]]/,
        severity: 'medium',
        description: 'Command Injection Characters',
        aiWeight: 0.6,
      },

      // GraphQL Attacks
      {
        pattern: /__schema/i,
        severity: 'high',
        description: 'GraphQL Introspection',
        aiWeight: 0.8,
      },
      {
        pattern: /fragment\s+\w+\s+on/i,
        severity: 'medium',
        description: 'GraphQL Fragment',
        aiWeight: 0.65,
      },

      // Rate Limiting Bypass
      {
        pattern: /x-forwarded-for:\s*[\d.,]+/i,
        severity: 'medium',
        description: 'Proxy Header Manipulation',
        aiWeight: 0.7,
      },

      // Bot Detection
      {
        pattern: /(curl|wget|python-requests|bot|crawler|spider)/i,
        severity: 'medium',
        description: 'Automated Tool Detection',
        aiWeight: 0.75,
      },
      {
        pattern: /headless/i,
        severity: 'high',
        description: 'Headless Browser Detection',
        aiWeight: 0.85,
      },
    ];
  }

  private async initializeAIModel() {
    // In a real implementation, this would load a trained ML model
    // For now, we'll use a simple heuristic-based approach
    this.aiModel = {
      predict: (features: any) => {
        // Simple AI prediction based on features
        let score = 0;

        // Analyze request frequency
        if (features.requestRate > 100) score += 0.3;
        if (features.requestRate > 500) score += 0.4;

        // Analyze pattern matches
        if (features.patternMatches > 0) score += 0.2;
        if (features.patternMatches > 2) score += 0.3;

        // Analyze user agent anomalies
        if (features.userAgentAnomaly) score += 0.2;

        // Analyze geographic anomalies
        if (features.geographicAnomaly) score += 0.1;

        return Math.min(score, 1.0);
      },
    };
  }

  public async analyzeRequest(
    ip: string,
    method: string,
    path: string,
    headers: { [key: string]: string },
    body: string,
    userAgent: string,
    recaptchaToken?: string
  ): Promise<{
    isThreat: boolean;
    confidence: number;
    threatType: string;
    action: 'block' | 'monitor' | 'allow';
  }> {
    const recaptchaScore = await this.verifyRecaptcha(recaptchaToken);
    const features = this.extractFeatures(
      ip,
      method,
      path,
      headers,
      body,
      userAgent,
      recaptchaScore
    );
    const aiScore = await this.aiModel.predict(features);

    // Check for immediate threats
    const immediateThreats = this.checkImmediateThreats(
      method,
      path,
      body,
      userAgent
    );

    if (immediateThreats.length > 0) {
      const highestThreat = immediateThreats.reduce((max, threat) =>
        threat.aiWeight > max.aiWeight ? threat : max
      );

      return {
        isThreat: true,
        confidence: Math.max(aiScore, highestThreat.aiWeight),
        threatType: highestThreat.description,
        action: highestThreat.severity === 'critical' ? 'block' : 'monitor',
      };
    }

    // AI-based decision
    const isThreat = aiScore > 0.7;
    const action =
      aiScore > 0.9 ? 'block' : aiScore > 0.7 ? 'monitor' : 'allow';

    return {
      isThreat,
      confidence: aiScore,
      threatType: isThreat ? 'AI Detected Anomaly' : 'Normal',
      action,
    };
  }

  private extractFeatures(
    ip: string,
    method: string,
    path: string,
    headers: { [key: string]: string },
    body: string,
    userAgent: string,
    recaptchaScore: number
  ) {
    const recentEvents = this.events.filter(
      e => e.ip === ip && e.timestamp > Date.now() - 60000
    );

    return {
      requestRate: recentEvents.length,
      patternMatches: this.countPatternMatches(method, path, body, userAgent),
      userAgentAnomaly: this.detectUserAgentAnomaly(userAgent),
      geographicAnomaly: this.detectGeographicAnomaly(ip),
      methodAnomaly: !['GET', 'POST', 'PUT', 'DELETE'].includes(method),
      pathAnomaly: path.length > 1000 || path.includes('..'),
      bodySize: body.length,
      headerAnomaly: Object.keys(headers).length > 50,
      recaptchaScore,
    };
  }

  private async verifyRecaptcha(token?: string): Promise<number> {
    if (!token) return 0;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) return 0;

    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();
    return data.success ? data.score : 0;
  }

  private countPatternMatches(
    method: string,
    path: string,
    body: string,
    userAgent: string
  ): number {
    const content = `${method} ${path} ${body} ${userAgent}`.toLowerCase();
    return this.threatPatterns.filter(pattern => pattern.pattern.test(content))
      .length;
  }

  private checkImmediateThreats(
    method: string,
    path: string,
    body: string,
    userAgent: string
  ): ThreatPattern[] {
    const content = `${method} ${path} ${body} ${userAgent}`.toLowerCase();
    return this.threatPatterns.filter(pattern => pattern.pattern.test(content));
  }

  private detectUserAgentAnomaly(userAgent: string): boolean {
    if (!userAgent || userAgent.length < 10) return true;
    if (
      /(curl|wget|python-requests|bot|crawler|spider|headless)/i.test(userAgent)
    )
      return true;
    return false;
  }

  private detectGeographicAnomaly(ip: string): boolean {
    // In a real implementation, this would use GeoIP lookup
    // For now, we'll use a simple heuristic
    return ip === '127.0.0.1' || ip.startsWith('192.168.');
  }

  public logEvent(event: Omit<SecurityEvent, 'timestamp' | 'aiConfidence'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      aiConfidence: 0.8, // Default confidence
    };

    this.events.push(securityEvent);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // Auto-block if too many events from same IP
    const recentEvents = this.events.filter(
      e => e.ip === event.ip && e.timestamp > Date.now() - 300000 // 5 minutes
    );

    if (recentEvents.length >= 10) {
      this.blockIP(event.ip, 'Too many security events', 60);
    }
  }

  public blockIP(ip: string, reason: string, durationMinutes: number = 60) {
    const now = Date.now();
    this.blockedIPs.set(ip, {
      reason,
      blockedAt: now,
      expiresAt: now + durationMinutes * 60 * 1000,
    });

    // Удаляем console.error для production безопасности
    // console.error(
    //   `🚫 AI Security: Blocked IP ${ip} - ${reason} for ${durationMinutes} minutes`
    // );
  }

  public isIPBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip);
    if (!blocked) return false;

    if (Date.now() > blocked.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  public getSecurityStats() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    const lastDay = now - 24 * 60 * 60 * 1000;

    const hourlyEvents = this.events.filter(e => e.timestamp > lastHour);
    const dailyEvents = this.events.filter(e => e.timestamp > lastDay);

    return {
      totalEvents: this.events.length,
      eventsLastHour: hourlyEvents.length,
      eventsLastDay: dailyEvents.length,
      blockedIPs: this.blockedIPs.size,
      aiAccuracy: 0.92, // Mock AI accuracy
      threatsDetected: hourlyEvents.filter(e => e.eventType === 'attack')
        .length,
      falsePositives: hourlyEvents.filter(e => e.eventType === 'suspicious')
        .length,
    };
  }

  public getRecentEvents(limit: number = 10) {
    return this.events
      .slice(-limit)
      .reverse()
      .map(event => ({
        timestamp: new Date(event.timestamp).toISOString(),
        ip: event.ip,
        eventType: event.eventType,
        action: event.action,
        severity: event.severity,
        aiConfidence: event.aiConfidence,
        details: event.details,
      }));
  }

  public getThreatPatterns() {
    return this.threatPatterns.map(pattern => ({
      description: pattern.description,
      severity: pattern.severity,
      aiWeight: pattern.aiWeight,
    }));
  }
}

// Export singleton instance
export const aiSecurity = new AISecuritySystem();
