'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface CSPStats {
  total: number;
  lastHour: number;
  lastDay: number;
  topDirectives: [string, number][];
  topIPs: [string, number][];
}

export function CSPStatus() {
  const [stats, setStats] = useState<CSPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/security/csp-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Failed to fetch CSP stats');
        }
      } catch (err) {
        setError('Error loading CSP stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            CSP Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            CSP Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getStatusColor = (violations: number) => {
    if (violations === 0) return 'text-green-600';
    if (violations < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (violations: number) => {
    if (violations === 0)
      return <CheckCircle className='h-4 w-4 text-green-600' />;
    if (violations < 10)
      return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
    return <AlertTriangle className='h-4 w-4 text-red-600' />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          Content Security Policy Status
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Overall Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Overall Status</span>
          <div className='flex items-center gap-2'>
            {getStatusIcon(stats.lastHour)}
            <span
              className={`text-sm font-medium ${getStatusColor(stats.lastHour)}`}
            >
              {stats.lastHour === 0 ? 'Secure' : `${stats.lastHour} violations`}
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className='grid grid-cols-3 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <div className='text-xs text-gray-500'>Total Violations</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold'>{stats.lastHour}</div>
            <div className='text-xs text-gray-500'>Last Hour</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold'>{stats.lastDay}</div>
            <div className='text-xs text-gray-500'>Last 24h</div>
          </div>
        </div>

        {/* Top Violated Directives */}
        {stats.topDirectives.length > 0 && (
          <div>
            <h4 className='text-sm font-medium mb-2'>
              Top Violated Directives
            </h4>
            <div className='space-y-1'>
              {stats.topDirectives.slice(0, 3).map(([directive, count]) => (
                <div
                  key={directive}
                  className='flex justify-between items-center'
                >
                  <span className='text-xs text-gray-600'>{directive}</span>
                  <Badge variant='secondary' className='text-xs'>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top IP Addresses */}
        {stats.topIPs.length > 0 && (
          <div>
            <h4 className='text-sm font-medium mb-2'>Top Violating IPs</h4>
            <div className='space-y-1'>
              {stats.topIPs.slice(0, 3).map(([ip, count]) => (
                <div key={ip} className='flex justify-between items-center'>
                  <span className='text-xs text-gray-600 font-mono'>{ip}</span>
                  <Badge variant='outline' className='text-xs'>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSP Info */}
        <Alert>
          <Shield className='h-4 w-4' />
          <AlertDescription>
            Content Security Policy is actively protecting against XSS attacks
            and other security threats.
            {stats.lastHour > 0 && (
              <span className='block mt-1 text-sm text-yellow-600'>
                {stats.lastHour} violation(s) detected in the last hour.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
