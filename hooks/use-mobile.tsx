'use client';

import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // SIMPLE CHECK - only by screen size
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
              // Mobile device = narrow screen (less than 768px width)
      const isMobileDevice = screenWidth < 768;
      
      setIsMobile(isMobileDevice);
    };

    // Perform check on load and when window size changes
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Clean up listener on unmount
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTelegram: false, isMetaMaskBrowser: false };
}

// Convenience alias to match older import signature
export const useIsMobile = useMobile;
