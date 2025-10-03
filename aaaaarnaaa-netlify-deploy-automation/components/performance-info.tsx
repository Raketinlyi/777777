'use client';

import { usePerformanceContext } from '@/hooks/use-performance-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Smartphone,
  Monitor,
  Zap,
  ZapOff,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const PerformanceInfo = () => {
  const { isLiteMode, isMobile, isWeakDevice, performanceInfo } =
    usePerformanceContext();
  const { hardwareConcurrency, deviceMemory, connectionSpeed } =
    performanceInfo;

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className='w-4 h-4' />;
    return <Monitor className='w-4 h-4' />;
  };

  const getConnectionIcon = () => {
    if (connectionSpeed === 'slow')
      return <WifiOff className='w-4 h-4 text-red-400' />;
    if (connectionSpeed === 'fast')
      return <Wifi className='w-4 h-4 text-green-400' />;
    return <Wifi className='w-4 h-4 text-gray-400' />;
  };

  const getPerformanceStatus = () => {
    if (isLiteMode) {
      return {
        text: 'Lite Mode',
        color: 'bg-orange-500',
        icon: <ZapOff className='w-4 h-4' />,
      };
    }
    return {
      text: 'Full Mode',
      color: 'bg-blue-500',
      icon: <Zap className='w-4 h-4' />,
    };
  };

  const status = getPerformanceStatus();

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg flex items-center gap-2'>
          {status.icon}
          Performance Status
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* Mode Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-400'>Mode:</span>
          <Badge className={status.color}>{status.text}</Badge>
        </div>

        {/* Device Type */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-400'>Device:</span>
          <div className='flex items-center gap-2'>
            {getDeviceIcon()}
            <span className='text-sm'>{isMobile ? 'Mobile' : 'Desktop'}</span>
          </div>
        </div>

        {/* Performance Level */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-400'>Performance:</span>
          <Badge variant={isWeakDevice ? 'destructive' : 'default'}>
            {isWeakDevice ? 'Weak Device' : 'Strong Device'}
          </Badge>
        </div>

        {/* Hardware Info */}
        {hardwareConcurrency > 0 && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>CPU:</span>
            <div className='flex items-center gap-2'>
              <Cpu className='w-4 h-4' />
              <span className='text-sm'>{hardwareConcurrency} cores</span>
            </div>
          </div>
        )}

        {deviceMemory > 0 && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>RAM:</span>
            <div className='flex items-center gap-2'>
              <HardDrive className='w-4 h-4' />
              <span className='text-sm'>{deviceMemory}GB</span>
            </div>
          </div>
        )}

        {/* Connection */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-400'>Connection:</span>
          <div className='flex items-center gap-2'>
            {getConnectionIcon()}
            <span className='text-sm capitalize'>
              {connectionSpeed === 'unknown' ? 'Unknown' : connectionSpeed}
            </span>
          </div>
        </div>

        {/* Auto-detection notice */}
        {isLiteMode && (
          <div className='mt-4 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md'>
            <p className='text-xs text-orange-700 dark:text-orange-300'>
              Lite mode automatically enabled for better performance on this
              device.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
