'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface SecurityStats {
  totalEvents: number;
  eventsLastHour: number;
  eventsLastDay: number;
  blockedIPs: number;
  suspiciousCount: number;
  attackCount: number;
  rateLimitCount: number;
  csrfFailureCount: number;
  botDetectedCount: number;
}

interface SecurityStatus {
  status: 'secure' | 'warning' | 'alert';
  timestamp: string;
  statistics: SecurityStats;
  recentActivity: {
    suspicious: number;
    attacks: number;
    rateLimits: number;
    csrfFailures: number;
    bots: number;
  };
  blockedIPsCount: number;
  systemHealth: {
    memoryUsage: { heapUsed: number };
    uptime: number;
    nodeVersion: string;
  };
}

export function SecurityStatus() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/security/status');
      if (!response.ok) {
        throw new Error('Failed to fetch security status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-500' />;
      case 'alert':
        return <XCircle className='h-5 w-5 text-red-500' />;
      default:
        return <Shield className='h-5 w-5 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'alert':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <Card className='bg-black/20 backdrop-blur-sm border-white/10'>
        <CardHeader>
          <CardTitle className='text-white flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin text-white/70' />
            <span className='ml-2 text-white/70'>
              Loading security status...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-black/20 backdrop-blur-sm border-white/10'>
        <CardHeader>
          <CardTitle className='text-white flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-4'>
            <XCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
            <p className='text-red-300 text-sm'>{error}</p>
            <Button
              onClick={fetchSecurityStatus}
              variant='outline'
              size='sm'
              className='mt-2'
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className='bg-black/20 backdrop-blur-sm border-white/10'>
      <CardHeader>
        <CardTitle className='text-white flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Security Status
          </div>
          <Badge className={getStatusColor(status.status)}>
            {getStatusIcon(status.status)}
            <span className='ml-1 capitalize'>{status.status}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Recent Activity */}
        <div>
          <h4 className='text-sm font-medium text-white/80 mb-2'>
            Recent Activity (1h)
          </h4>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div className='flex justify-between'>
              <span className='text-white/60'>Suspicious:</span>
              <span className='text-yellow-300'>
                {status.recentActivity.suspicious}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-white/60'>Attacks:</span>
              <span className='text-red-300'>
                {status.recentActivity.attacks}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-white/60'>Rate Limits:</span>
              <span className='text-orange-300'>
                {status.recentActivity.rateLimits}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-white/60'>CSRF Failures:</span>
              <span className='text-purple-300'>
                {status.recentActivity.csrfFailures}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-white/60'>Bots Detected:</span>
              <span className='text-blue-300'>
                {status.recentActivity.bots}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-white/60'>Blocked IPs:</span>
              <span className='text-red-400'>{status.blockedIPsCount}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div>
          <h4 className='text-sm font-medium text-white/80 mb-2'>
            System Health
          </h4>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div className='flex justify-between'>
              <span className='text-white/60'>Uptime:</span>
              <span className='text-green-300'>
                {Math.floor(status.systemHealth.uptime / 3600)}h{' '}
                {Math.floor((status.systemHealth.uptime % 3600) / 60)}m
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-white/60'>Memory:</span>
              <span className='text-blue-300'>
                {Math.round(
                  status.systemHealth.memoryUsage.heapUsed / 1024 / 1024
                )}
                MB
              </span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className='text-xs text-white/40 text-center pt-2 border-t border-white/10'>
          Last updated: {new Date(status.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default SecurityStatus;
