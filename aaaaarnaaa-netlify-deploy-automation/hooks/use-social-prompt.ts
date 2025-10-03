'use client';

import { useState, useEffect, useCallback } from 'react';

const DAYS_5_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Custom hook to decide when to show the social prompt modal.
 * @param wallet connected wallet address (checksummed).
 * @param pingedJustNow boolean flag that becomes true right after a successful ping action.
 */
export function useSocialPrompt(
  wallet: string | undefined,
  pingedJustNow: boolean
) {
  const [show, setShow] = useState(false);

  // Helper to close + mark last prompt timestamp
  const close = useCallback(() => {
    if (wallet) {
      localStorage.setItem(
        `lastSocialPrompt:${wallet}`,
        new Date().toISOString()
      );
    }
    setShow(false);
  }, [wallet]);

  // Evaluate display logic whenever ping happens
  useEffect(() => {
    if (!pingedJustNow || !wallet) return;

    try {
      const lastStr = localStorage.getItem(`lastSocialPrompt:${wallet}`);
      const lastTime = lastStr ? Date.parse(lastStr) : 0;
      if (Date.now() - lastTime >= DAYS_5_MS) {
        setShow(true);
      }
    } catch (err) {}
  }, [pingedJustNow, wallet]);

  return { show, close };
}
