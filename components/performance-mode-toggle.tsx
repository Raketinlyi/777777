'use client';

import { usePerformanceContext } from '@/hooks/use-performance-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Zap, ZapOff, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PerformanceModeToggle = () => {
  const {
    isLiteMode,
    isMobile,
    isWeakDevice,
    setManualLiteMode,
    performanceInfo,
  } = usePerformanceContext();
  const { hardwareConcurrency, deviceMemory } = performanceInfo;

  const handleToggle = () => {
    setManualLiteMode(!isLiteMode);
  };

  const getDeviceInfo = () => {
    const info = [];
    if (hardwareConcurrency > 0) {
      info.push(`${hardwareConcurrency} cores`);
    }
    if (deviceMemory > 0) {
      info.push(`${deviceMemory}GB RAM`);
    }
    if (isMobile) {
      info.push('Mobile');
    }
    return info.join(', ');
  };

  return (
    <div className='flex items-center gap-2'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={handleToggle}
              className={`transition-all duration-200 ${
                isLiteMode
                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {isLiteMode ? (
                <>
                  <ZapOff className='w-4 h-4 mr-1' />
                  Lite
                </>
              ) : (
                <>
                  <Zap className='w-4 h-4 mr-1' />
                  Full
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className='text-xs'>
              <p className='font-medium mb-1'>
                {isLiteMode ? 'Lite Mode' : 'Full Mode'}
              </p>
              <p className='text-gray-500 mb-1'>
                {isLiteMode
                  ? 'Simplified interface for better performance'
                  : 'Full interface with all animations and effects'}
              </p>
              <p className='text-gray-400'>Device: {getDeviceInfo()}</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {(isWeakDevice || isMobile) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant='secondary' className='text-xs'>
                {isMobile ? (
                  <Smartphone className='w-3 h-3 mr-1' />
                ) : (
                  <Monitor className='w-3 h-3 mr-1' />
                )}
                {isWeakDevice ? 'Weak Device' : 'Mobile'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className='text-xs'>
                <p>Performance optimized mode</p>
                <p className='text-gray-500'>Some features may be simplified</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};
