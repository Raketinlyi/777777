import { NextRequest, NextResponse } from 'next/server';
import { aiSecurity } from '@/utils/ai-security';

export async function GET(req: NextRequest) {
  try {
    // Get AI security statistics
    const stats = aiSecurity.getSecurityStats();

    // Get recent security events (last 10)
    const recentEvents = aiSecurity.getRecentEvents
      ? aiSecurity.getRecentEvents(10)
      : [];

    const aiStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      aiSystem: {
        accuracy: stats.aiAccuracy,
        threatsDetected: stats.threatsDetected,
        falsePositives: stats.falsePositives,
        totalEvents: stats.totalEvents,
        eventsLastHour: stats.eventsLastHour,
        blockedIPs: stats.blockedIPs,
      },
      recentActivity: {
        threats: stats.threatsDetected,
        suspicious: stats.falsePositives,
        blocked: stats.blockedIPs,
      },
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    // Add warning if high activity detected
    if (stats.eventsLastHour > 50) {
      aiStatus.status = 'warning';
    }

    if (stats.threatsDetected > 5) {
      aiStatus.status = 'alert';
    }

    return NextResponse.json(aiStatus, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-AI-Security-Status': aiStatus.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get AI security status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'analyze_request':
        if (data.ip && data.method && data.path) {
          const analysis = await aiSecurity.analyzeRequest(
            data.ip,
            data.method,
            data.path,
            data.headers || {},
            data.body || '',
            data.userAgent || ''
          );
          return NextResponse.json({ analysis });
        }
        break;

      case 'block_ip':
        if (data.ip && data.reason) {
          aiSecurity.blockIP(data.ip, data.reason, data.duration || 60);
          return NextResponse.json({
            success: true,
            message: 'IP blocked by AI',
          });
        }
        break;

      case 'get_threat_patterns':
        return NextResponse.json({
          patterns: aiSecurity.getThreatPatterns
            ? aiSecurity.getThreatPatterns()
            : [],
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process AI security action' },
      { status: 500 }
    );
  }
}
