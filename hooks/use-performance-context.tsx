'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { usePerformanceMode } from './use-performance-mode';

interface PerformanceInfo {
  hardwareConcurrency: number;
  deviceMemory: number;
  connectionSpeed: 'slow' | 'average' | 'fast' | 'unknown';
}

interface PerformanceContextType {
  isLiteMode: boolean;
  setManualLiteMode: (enabled: boolean) => void;
  isMobile: boolean;
  isWeakDevice: boolean;
  performanceInfo: PerformanceInfo;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(
  undefined
);

// Device detection utilities
const detectSlowDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for low-end devices
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const connection = (navigator as any).connection;

  // Low memory devices (< 4GB)
  if (memory && memory < 4) return true;

  // Low core count (< 4 cores)
  if (cores && cores < 4) return true;

  // Slow network connection
  if (
    connection &&
    (connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g')
  ) {
    return true;
  }

  return false;
};

const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isWeakDevice, setIsWeakDevice] = useState(false);

  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo>({
    hardwareConcurrency: 0,
    deviceMemory: 0,
    connectionSpeed: 'unknown',
  });

  useEffect(() => {
    const mobile = detectMobileDevice();
    const slowDevice = detectSlowDevice();

    setIsMobile(mobile);
    setIsWeakDevice(slowDevice);

    // Always disable lite mode - show all effects
    setIsLiteMode(false);
    localStorage.setItem('performanceMode', 'false');

    // gather performance info safely
    const cores =
      typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 0;
    const memory =
      typeof navigator !== 'undefined' && (navigator as any).deviceMemory
        ? (navigator as any).deviceMemory
        : 0;
    let connectionSpeed: 'slow' | 'average' | 'fast' | 'unknown' = 'unknown';
    const connection =
      typeof navigator !== 'undefined' && (navigator as any).connection;
    if (connection) {
      if (
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g'
      )
        connectionSpeed = 'slow';
      else if (connection.effectiveType === '3g') connectionSpeed = 'average';
      else if (connection.effectiveType === '4g') connectionSpeed = 'fast';
    }

    setPerformanceInfo({
      hardwareConcurrency: cores,
      deviceMemory: memory,
      connectionSpeed,
    });
  }, []);

  const handleSetIsLiteMode = (enabled: boolean) => {
    // Always disable lite mode - ignore user preference
    setIsLiteMode(false);
    localStorage.setItem('performanceMode', 'false');
  };

  return (
    <PerformanceContext.Provider
      value={{
        isLiteMode,
        setManualLiteMode: handleSetIsLiteMode,
        isMobile,
        isWeakDevice,
        performanceInfo,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error(
      'usePerformanceContext must be used within a PerformanceProvider'
    );
  }
  return context;
}
