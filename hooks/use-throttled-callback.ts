'use client';

import { useCallback, useRef } from 'react';

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCall = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;

      // Store the latest args
      lastArgs.current = args;

      // If enough time has passed since the last call, execute immediately
      if (timeSinceLastCall >= delay) {
        lastCall.current = now;
        callback(...args);
        return;
      }

      // Otherwise, set a timeout to execute after the remaining delay
      if (timeoutId.current === null) {
        timeoutId.current = setTimeout(() => {
          if (lastArgs.current) {
            callback(...lastArgs.current);
          }
          lastCall.current = Date.now();
          timeoutId.current = null;
          lastArgs.current = null;
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}
