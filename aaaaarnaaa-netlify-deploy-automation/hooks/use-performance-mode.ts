import { useState, useEffect } from 'react';

export interface PerformanceInfo {
  isLiteMode: boolean;
  isMobile: boolean;
  isWeakDevice: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export const usePerformanceMode = (): PerformanceInfo => {
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo>({
    isLiteMode: false,
    isMobile: false,
    isWeakDevice: false,
    hardwareConcurrency: 0,
    deviceMemory: 0,
    connectionSpeed: 'unknown',
  });

  useEffect(() => {
    const detectPerformance = () => {
      // Detect mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 768;

      // Detect device characteristics
      const hardwareConcurrency = navigator.hardwareConcurrency || 0;
      const deviceMemory = (navigator as any).deviceMemory || 0;

      // Determine weak device
      const isWeakDevice =
        hardwareConcurrency <= 4 || deviceMemory <= 2 || isMobile;

      // Detect connection speed
      let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g'
        ) {
          connectionSpeed = 'slow';
        } else if (
          connection.effectiveType === '3g' ||
          connection.effectiveType === '4g'
        ) {
          connectionSpeed = 'fast';
        }
      }

      // Auto-enable lite mode for weak devices
      const isLiteMode = isWeakDevice || connectionSpeed === 'slow';

      setPerformanceInfo({
        isLiteMode,
        isMobile,
        isWeakDevice,
        hardwareConcurrency,
        deviceMemory,
        connectionSpeed,
      });
    };

    detectPerformance();

    // Recalculate on window resize
    const handleResize = () => {
      detectPerformance();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return performanceInfo;
};
