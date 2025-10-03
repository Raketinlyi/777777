'use client';

import { motion } from 'framer-motion';
import { usePerformanceContext } from '@/hooks/use-performance-context';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Zap, ZapOff } from 'lucide-react';

export function PerformanceIndicator() {
  const { isMobile, isWeakDevice, performanceInfo } = usePerformanceContext();
  
  if (!isMobile) return null; // Показываем только на мобильных
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className='fixed top-4 right-4 z-50'
    >
      <Badge 
        variant={isWeakDevice ? 'destructive' : 'default'}
        className='flex items-center gap-2 bg-black/80 backdrop-blur-sm border-purple-500/30'
      >
        {isMobile ? (
          <Smartphone className='w-3 h-3' />
        ) : (
          <Monitor className='w-3 h-3' />
        )}
        {isWeakDevice ? (
          <ZapOff className='w-3 h-3' />
        ) : (
          <Zap className='w-3 h-3' />
        )}
        <span className='text-xs'>
          {isWeakDevice ? 'Lite' : 'Full'}
        </span>
      </Badge>
    </motion.div>
  );
}